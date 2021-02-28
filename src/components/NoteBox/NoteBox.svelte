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
  let svg;
  let upbeat = 0;
  let dev = typeof location !== 'undefined' && /localhost/.test(location.hostname);

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
  // also variables currentMeasure, currentBeatInMeasure, measureCompletedTime to track state
  // onBeat: if event.detail.countdown do nothing (well, perhaps upbeat..)
  // check if measureCompletedTime >= measure.length  -> increase currentMeasure and reset currentBeatInMeasure (we're done with that one)
  // if currentMeasure >= measures.length, tune finished
  // if jump, set currentMeasure (again!)
  // if new measure and time signature different, change it
  // trigger & schedule note movements according to beat queue entry

  let measureList;
  let currentMeasure = 0;
  let currentBeatInMeasure = -1;
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
    setTimeout(function () {
      let svgElm = document.getElementsByTagName('svg')[0];
      renderingMusic = false;
      // measureList comes from the server, but we'll augment it per data model
      measureList = JSON.parse(svgElm.dataset.measureList);
      let repeats = JSON.parse(svgElm.dataset.repeats);
      upbeat = parseFloat(svgElm.dataset.upbeat);
      console.log({ upbeat, measureList, repeats });
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
      if (upbeat) {
        // TODO: set beatInMeasure initially to last whole beat before upbeat
      }
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

          console.log({upbeat, start, end, measureDuration: measure.duration, normalMeasureDuration})
          // this is an upbeat note. The metronome logic will pretend it is a normal,
          // full measure, so shift the timing accordingly towards the end
          start += (normalMeasureDuration - measure.duration);
          measure.duration = normalMeasureDuration;
        } else if (measureIndex > 0) {
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
    }, 10);
    console.log(measureList);
  });

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
          //scrollIfRequired(beatInfo.note);
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

  // onBeat: check if measureCompletedTime >= measure.length  -> increase currentMeasure and reset currentBeatInMeasure (we're done with that one)
  // if currentMeasure >= measures.length, tune finished
  // if jump, set currentMeasure (again!)
  // if new measure and time signature different, change it
  // trigger & schedule note movements according to beat queue entry

  function onBeat(evt) {
    if (evt.detail.countdown) {
      dispatch('countdown', {last: evt.detail.countsLeft === 0}); // RecordUI will count visually down
      if (!upbeat) {
        return; // nothing to do here
      }
      // if upbeat, we have an initial measure which we want the _timeNumerator_
      // last beats from the countdown to "play"
      if(upbeat && evt.detail.countsLeft > timeNumerator) {
        return;
      }
    }
    let measure = measureList[currentMeasure];
    if (measureCompletedTime >= measure.duration) {
      console.log('measure is finished', measureCompletedTime, measure.duration)
      // next measure!
      currentMeasure++;
      currentBeatInMeasure = -1;
      if (currentMeasure >= measureList.length) {
        dispatch('ended');
        metronome.stop();
        currentMeasure = 0;
        clearHighlight();
        return;
      } else {
        measure = measureList[currentMeasure];
        measureCompletedTime = 0;
        if (measure.jumps.length) {
          console.log('jumping from ' + currentMeasure + ' to ' + measure.jumps[0])
          currentMeasure = measure.jumps.shift();
          measure = measureList[currentMeasure];
        }
      }
      // did the time signature change?
      if (measure.timeSignature) {
        timeNumerator = measure.timeSignature.numerator;
        timeDenominator = measure.timeSignature.denominator;
      }
      // detect tempo changes
      if (measure.tempoInBPM && measure.tempoInBPM !== tempo) {
        console.log('tempo change')
        tempo = measure.tempoInBPM;
      }
    }
    let beatDuration = 1 / timeNumerator;
    measureCompletedTime += beatDuration;
    currentBeatInMeasure++;
    highlightBeat(currentMeasure, currentBeatInMeasure);
  }

  export function initPlaythrough() {
    metronome.play();
  }
  export function stopPlaythrough() {
    metronome.stop();
    currentMeasure = 0;
    currentBeatInMeasure = -1;
    clearHighlight();
  }

  // https://stackoverflow.com/a/35940276
  function getScrollParent(node) {
    if (node == null) {
      return null;
    }

    if (node.scrollHeight > node.clientHeight && node.clientHeight > 0) {
      return node;
    } else {
      return getScrollParent(node.parentNode);
    }
  }
  // https://stackoverflow.com/a/47768164
  function getOffset(element) {
    var bound = element.getBoundingClientRect();
    var html = document.documentElement;

    return {
      top: bound.top + window.pageYOffset - html.clientTop,
      left: bound.left + window.pageXOffset - html.clientLeft,
    };
  }
  function scrollIfRequired(elm) {
    let offset = getOffset(elm);
    //if (offset.top > winHeight * 0.7) {
      let scrollable = getScrollParent(elm);
      console.log('scrollable', scrollable, scrollable.scrollBy)
      scrollable.scrollTo({top: offset.top - 100});
    //}
  }
  let winHeight;
</script>

<svelte:window bind:innerHeight={winHeight} />
{#if audioContext}
<Metronome
  bind:this={metronome}
  {tempo}
  {timeNumerator}
  {timeDenominator}
  {audioContext}
  {soundRecorder}
  on:beat={onBeat}
/>
{/if}
{#if renderingMusic || !audioContext}
  <div class="loading"><Loading /></div>
{/if}

<!--
<button on:click={metronome.play()}>start/stop</button>
-->

<div class="note-box" bind:clientWidth={elemWidth}>
  {@html svg}
</div>
{#if dev}
<button on:click={metronome.toggle}>start/stop</button>
{/if}
<style>
  :global(.activeNote),
  :global(.activeNote path),
  :global(.activeNote g) {
    filter: invert(29%) sepia(82%) saturate(4448%) hue-rotate(174deg)
      brightness(60%) contrast(101%);
  }
  .note-box {
    margin-top: 30px;
    padding: 5%;
    height: 85vh;
    overflow: auto;
  }
  .loading {
    z-index: 500;
    width: 100%;
    height: 80vh;
    background: #fff;
  }
</style>
