<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Loading from '../Loading/Loading.svelte';
  import Metronome from '../Metronome/Metronome.svelte';

  const dispatch = createEventDispatcher();
  let elemWidth = 0;
  // Box for displaying notes from musicXML

  export let project;
  export let trackName = null;
  let tempo = project.bpm || 96;
  let renderingMusic = true;
  let timeNumerator = 4;
  let timeDenominator = 4;
  let met;
  let svg;
  let upbeat = 0;

  let beatQueue = [];
  let measureList;
  let jumps = [];
  let currentBeat = -1;
  let currentMeasure = -1;

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
      measureList = JSON.parse(svgElm.dataset.measureList);
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
          jumps[jpmIdx] = jumps[jpmIdx] || [];
          let target = repeatStarts.length
            ? repeatStarts.shift().measureIndex
            : 0;
          jumps[jpmIdx].push(target);
        } else if (repeat.type === 3 && repeat.endingIndices.includes(1)) {
          // start of "house" - ending 1
          // looking forward to find house two..
          // first time we get here, we do nothing - next time we jump ahead to 2
          let jpmIdx = repeat.measureIndex;
          jumps[jpmIdx] = jumps[jpmIdx] || [];
          jumps[jpmIdx].push(repeat.measureIndex); // do nothing on first touch
          let target = repeats.find(
            (item, itemIdx) =>
              itemIdx > idx && item.type === 3 && item.endingIndices.includes(2)
          );
          if (target) {
            jumps[jpmIdx].push(target.measureIndex); // jump here on second touch
          }
        }
      });
      // We want an array of arrays of notes within the "beat"
      // one measure is timeNumerator items
      let beatDuration = 1 / timeNumerator; // 0.25 for 4/4, 0.125 for 6/8 ..
      let notes = document.getElementsByClassName('vf-stavenote');
      for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        let start = note.dataset.timeStart;
        let end = note.dataset.timeEnd;
        let beat = Math.floor(start / beatDuration);
        // Skip highlighting upbeats (for now)
        if (
          /* i === 0 && */
          upbeat &&
          note.dataset.measure === '0' // &&
          /* upbeat < beatDuration */
        ) {
          // if upbeat is smaller than beatDuration,
          // the first note does not start on the beat
          /*
          pushQueue(beat, {
            delay: beatDuration - upbeat,
            note,
            measure: note.dataset.measure,
          });
          */
          continue;
        }
        if ((start % beatDuration) - upbeat === 0) {
          // this note starts exactly on the beat
          pushQueue(beat, { note, measure: note.dataset.measure });
        } else {
          // should highlight at _delay_ after beat
          let delay = start % beatDuration; // measure unit, not time
          pushQueue(beat, { delay, note, measure: note.dataset.measure });
        }
      }
    }, 10);
    console.log(beatQueue);
  });

  function pushQueue(beat, noteObj) {
    if (!beatQueue[beat]) {
      beatQueue[beat] = [];
    }
    beatQueue[beat].push(noteObj);
  }

  function highlightBeat() {
    if (beatQueue[currentBeat] && beatQueue[currentBeat].length) {
      for (let i = 0; i < beatQueue[currentBeat].length; i++) {
        let beatInfo = beatQueue[currentBeat][i];
        if (currentMeasure !== beatInfo.measure) {
          if (measureList && measureList[beatInfo.measure]) {
            if (measureList[beatInfo.measure].timeSignature) {
              timeNumerator =
                measureList[beatInfo.measure].timeSignature.numerator;
              timeDenominator =
                measureList[beatInfo.measure].timeSignature.denominator;
            }
          }
          currentMeasure = beatInfo.measure;
        }
        if (beatInfo.delay) {
          highlightAfterDelay(beatInfo.delay, beatInfo.note);
        } else {
          clearHighlight();
          beatInfo.note.classList.add('activeNote');
          //beatInfo.note.scrollIntoView();
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

  function onBeat(evt) {
    currentBeat++;
    if (beatQueue[currentBeat] && beatQueue[currentBeat][0]) {
      if (beatQueue[currentBeat][0].measure !== currentMeasure) {
        // check for repetition jumps..
        let newMeasure = beatQueue[currentBeat][0].measure;
        if (jumps[newMeasure]) {
          let target = jumps[newMeasure].shift();
          if (!jumps[newMeasure].length) {
            delete jumps[newMeasure];
          }
          if (target !== newMeasure) {
            let newBeat = beatQueue.findIndex(
              item =>
                item && item.find && item.find(child => child.measure == target)
            );
            console.log({ target, newMeasure, newBeat, currentBeat });
            if (newBeat !== -1) {
              currentBeat = newBeat;
            } // TODO: else 0?
          }
        }
      }
    }
    if (currentBeat < beatQueue.length) {
      highlightBeat();
    } else {
      dispatch('ended');
      met.stop();
      currentBeat = 0;
      clearHighlight();
      return;
    }
  }

  export function initPlaythrough() {
    met.play();
  }
  export function stopPlaythrough() {
    met.stop();
    currentBeat = 0;
    clearHighlight();
  }
</script>

<Metronome
  bind:this={met}
  on:beat={onBeat}
  {tempo}
  {upbeat}
  {timeNumerator}
  {timeDenominator}
/>
{#if renderingMusic}
  <div class="loading"><Loading /></div>
{/if}

<button on:click={met.play()}>start/stop</button>

<div class="note-box" bind:clientWidth={elemWidth}>
  {@html svg}
</div>

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
