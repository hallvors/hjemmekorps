<script>
  // Box for displaying notes from musicXML (SVG format)
  import { createEventDispatcher, onMount } from 'svelte';
  import Loading from '../Loading/Loading.svelte';
  import Metronome from '../Metronome/Metronome.svelte';

  const dispatch = createEventDispatcher();

  export let project;
  export let trackName = null;
  export let soundRecorder;
  export let audioContext;

  let elemWidth = 0;
  let tempo = project.bpm || 96;
  let renderingMusic = true;
  let timeNumerator = 4;
  let timeDenominator = 4;
  let metronome;
  let svg = '';
  let upbeat = 0;

  // To move a cursor correctly, we need to know about _beats, measures and jumps_
  // Beat signals arrive from the metronome and potentially cause cursor movements.
  // We set up a queue (sparse array) of beats that may cause a note highlight
  // either immediately or after a delay.
  // Jumps are used for repeats and recorded on a per-measure basis. Whenever cursor reaches a new
  // measure, it checks for jump instructions. More than one jump can be queued for a measure, and
  // they are executed in FIFO order. Jumps will target another measure (but in practise reset beat
  // counter to the first beat queue entry related to the target measure.)
  // Rouch sketch of data model:
  // measures = [
  //    { jumps: [3,7], length: 0.125, beats: [{note}, {note, delay}],
  //          timeSignature: {numerator, denominator}, tempoInBPM },
  //  ]
  // also variables measureCompletedTime to track state
  // onBeat: if event.detail.countdown do nothing (well, perhaps upbeat..)
  // if measureCount >= measures.length, tune finished
  // if jump, set measureCount (again!)
  // if new measure and time signature different, change it
  // trigger & schedule note movements according to beat queue entry

  let measureList;
  let measureCompletedTime = 0.0;

  onMount(async function () {
    let request = await fetch(
      `/api/project/${project._id}/score/${
        trackName ? encodeURIComponent(trackName) : ''
      }/svg?width=${elemWidth}`,
      { credentials: 'same-origin' }
    );
    svg = await request.text();
    // We throw in a timeout to let Svelte
    // render the SVG variable
    setTimeout(function svgLoaded() {
      let svgElm = document.getElementsByTagName('svg')[0];
      if (!svgElm) {
        setTimeout(svgLoaded, 30);
        return;
      }
      renderingMusic = false;
      measureList = processMusicData(svgElm);
    }, 10);
    //console.log({ measureList });
  });

  function processMusicData(svgElm) {
    // measureList comes from the server, but we'll augment it per data model
    let measureList = JSON.parse(svgElm.dataset.measureList);
    if (measureList[0] && measureList[0].tempoInBPM) {
      tempo = measureList[0].tempoInBPM;
    }
    let repeats = JSON.parse(svgElm.dataset.repeats);
    upbeat = parseFloat(svgElm.dataset.upbeat);
    // turn repeat data into jump instructions
    // CAVEAT: OSMD might change representation of repeat data?
    let repeatStarts = [];
    repeats.forEach((repeat, idx) => {
      if (repeat.type === 0) {
        // start of repetition - |:
        repeatStarts.push(repeat);
      } else if (repeat.type === 2) {
        // end of repetition - :|
        let jpmIdx = repeat.measureIndex + 1;
        let target = repeatStarts.length
          ? repeatStarts.shift().measureIndex
          : 0;
        measureList[jpmIdx].jumps.push(target);
      } else if (repeat.type === 3 && repeat.endingIndices.includes(1)) {
        // start of "house" - ending 1
        // looking forward to find house two..
        // first time we get here, we do nothing - next time we jump ahead to 2
        let jpmIdx = repeat.measureIndex;
        measureList[jpmIdx].jumps.push(jpmIdx); // do nothing on first touch
        let target = repeats.find(
          (item, itemIdx) =>
            itemIdx > idx && item.type === 3 && item.endingIndices.includes(2)
        );
        if (target) {
          measureList[jpmIdx].jumps.push(target.measureIndex); // jump here on second touch
        }
      }
    });
    // We want an array of arrays of notes within the "beat"
    // one *complete* measure is timeNumerator items
    // Caveat: we may have a first *incomplete* measure in case of upbeats
    let beatDuration = 1 / timeNumerator; // 0.25 for 4/4, 0.125 for 6/8 ..
    let notes = document.getElementsByClassName('vf-stavenote');
    let beatInMeasure = 0;
    /*
      if (upbeat) {
        // TODO: set beatInMeasure initially to last whole beat before upbeat
      }
*/
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      let start = parseFloat(note.dataset.timeStart);
      let measureIndex = parseInt(note.dataset.measure);
      let measure = measureList[measureIndex] || { notes: [] }; // the right-of-|| part should never happen
      // pick up changing time signatures..
      if (measure.timeSignature) {
        beatDuration = 1 / measure.timeSignature.numerator;
      }
      let end = parseFloat(note.dataset.timeEnd);

      // Important: if it's the first measure and it is an upbeat,
      // we need to calculate the timing of the note from the *end*
      // of the measure.
      if (upbeat && measureIndex === 0) {
        const normalMeasureDuration = timeNumerator / timeDenominator;
        // this is an upbeat note. The metronome logic will pretend it is a normal,
        // full measure, so shift the timing accordingly towards the end
        start += normalMeasureDuration - upbeat;
        measure.duration = normalMeasureDuration;
      } else if (measureIndex >= 0) {
        // start is in seconds since beginning of the piece,
        // but it's easire to calculate if relative to measure
        start -= measure.start;
      }
      beatInMeasure = Math.floor(start / beatDuration);

      if (start % beatDuration === 0) {
        // this note starts exactly on the beat
        pushQueue(measure, beatInMeasure, { note });
      } else {
        // should highlight at _delay_ after beat
        let delay = start % beatDuration;
        pushQueue(measure, beatInMeasure, {
          delay,
          note,
        });
      }
    }
    return measureList;
  }

  function pushQueue(measure, beat, noteObj) {
    if (!measure.beats[beat]) {
      measure.beats[beat] = [];
    }
    measure.beats[beat].push(noteObj);
  }

  function highlightBeat(measureIdx, beatIdx) {
    if (measureList[measureIdx] && measureList[measureIdx].beats[beatIdx]) {
      for (let i = 0; i < measureList[measureIdx].beats[beatIdx].length; i++) {
        let beatInfo = measureList[measureIdx].beats[beatIdx][i];

        if (beatInfo.delay) {
          highlightAfterDelay(beatInfo.delay, beatInfo.note);
        } else {
          clearHighlight();
          beatInfo.note.classList.add('activeNote');
          scrollIfRequired(beatInfo.note);
        }
      }
    }
  }

  function clearHighlight() {
    let oldElms = document.getElementsByClassName('activeNote');
    for (let i = oldElms.length - 1; i >= 0; i--) {
      if (oldElms[i]) {
        oldElms[i].classList.remove('activeNote');
      }
    }
  }

  function highlightAfterDelay(delay, note) {
    let msPerMeasure = (60 / tempo) * timeNumerator * 1000;
    setTimeout(function () {
      clearHighlight();
      note.classList.add('activeNote');
    }, delay * msPerMeasure);
  }

  // if measureCount >= measures.length, tune finished
  // if jump, set measureCount (again!)
  // if new measure and time signature different, change it
  // trigger & schedule note movements according to beat queue entry
  let previousMeasure;
  function onBeat(evt) {
    // Two first measures are countdown - if upbeat,
    // upbeat starts during second measure
    let measureCount = evt.detail.measureCount;
    if (evt.detail.countdown) {
      // RecordUI will count visually down
      dispatch(
        'countdown',
        Object.assign({ last: evt.detail.countdown === null }, evt.detail)
      );
      if (!upbeat) {
        return; // nothing to do here
      }
    }
    let measure = measureList[measureCount];
    if (!measure) {
      if (measureCount >= measureList.length) {
        dispatch('ended');
        metronome.stop();
        clearHighlight();
      }
      return;
    }

    if (previousMeasure !== measureCount) {
      // we're entering a new measure
      measureCompletedTime = 0;
      if (measure.jumps.length) {
        measureCount = measure.jumps.shift();
        measure = measureList[measureCount];
        metronome.jumpToMeasure(measureCount);
      }
      // did the time signature change?
      if (measure.timeSignature) {
        timeNumerator = measure.timeSignature.numerator;
        timeDenominator = measure.timeSignature.denominator;
      }
      // detect tempo changes
      if (measure.tempoInBPM && measure.tempoInBPM !== tempo) {
        console.log('tempo change');
        tempo = measure.tempoInBPM;
      }
    }

    let beatDuration = 1 / timeNumerator;
    measureCompletedTime += beatDuration;
    highlightBeat(measureCount, evt.detail.beatInMeasure);
    previousMeasure = measureCount;
  }

  export function initPlaythrough() {
    measureCompletedTime = 0.0;
    metronome.play();
  }
  export function stopPlaythrough() {
    metronome.stop();
    clearHighlight();
    // reset music data (repeats are "used" when cursor goes through data)
    let svgElm = document.getElementsByTagName('svg')[0];
    measureList = processMusicData(svgElm);
  }

  function scrollIfRequired(elm) {
    let rect = elm.getBoundingClientRect();
    let navs = document.getElementsByTagName('nav');
    let navbarHeight = navs[0].offsetHeight;
    for (let i = 0; i < navs.length; i++) {
      navbarHeight = Math.max(
        navbarHeight,
        navs[i].getBoundingClientRect().bottom
      );
    }
    let tooHigh = rect.y < navbarHeight * 1.1;
    let tooLow = rect.bottom > winHeight - rect.height;
    if (tooHigh || tooLow) {
      let scroll =
        rect.y + document.documentElement.scrollTop - navbarHeight * 1.2;
      document.documentElement.scrollTop = scroll;
    }
  }

  let winHeight;
</script>

<svelte:window bind:innerHeight={winHeight} />

{#if audioContext}
  <Metronome
    bind:this={metronome}
    {tempo}
    {upbeat}
    {timeNumerator}
    {audioContext}
    {soundRecorder}
    on:beat={onBeat}
  />
{/if}
{#if renderingMusic}
  <div class="loading">
    <Loading message="Tilpasser notene til din skjerm.." />
  </div>
{/if}
<div bind:clientWidth={elemWidth} />
<div class="note-box">
  {@html svg}
</div>

<style>
  :global(.activeNote),
  :global(.activeNote path),
  :global(.activeNote g) {
    filter: invert(29%) sepia(82%) saturate(4448%) hue-rotate(174deg)
      brightness(60%) contrast(101%);
  }
  :global(html) {
    scroll-behavior: smooth;
  }
  .note-box {
    /*
      Whoever embeds a NoteBox should style margins
      and padding - our task is to fill all the space
      we're given with sheet music.
    */
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: auto;
  }
  .loading {
    z-index: 500;
    width: 100%;
    height: 80vh;
    background: #fff;
  }
</style>
