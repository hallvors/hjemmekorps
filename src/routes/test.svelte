<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    //    const res = await this.fetch(`/api/project/${id}`);
    const res = await this.fetch(
      '/api/project/HO2csGLF2Fpgu974VKEh3k/score/B♭ Clarinet/svg?width=750'
    );
    const svg = await res.text();

    return {
      svg,
    };
  }
</script>

<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Metronome from '../components/Metronome/Metronome.svelte';

  const dispatch = createEventDispatcher();
  export let svg;
  export let tempo = 80;
  let timeNumerator = 4;
  let timeDenominator = 4;
  let met;

  let beatQueue = [];
  let measureList;
  let jumps = {};
  onMount(function () {
    let svgElm = document.getElementsByTagName('svg')[0];
    measureList = JSON.parse(svgElm.dataset.measureList);
    let repeats = JSON.parse(svgElm.dataset.repeats);

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

      if (start % beatDuration === 0) {
        // this note starts exactly on the beat
        pushQueue(beat, { note, measure: note.dataset.measure });
      } else {
        // should highlight at _delay_ after beat
        let delay = start % beatDuration; // measure unit, not time
        pushQueue(beat, { delay, note, measure: note.dataset.measure });
      }
    }
  });

  function pushQueue(beat, noteObj) {
    if (!beatQueue[beat]) {
      beatQueue[beat] = [];
    }
    beatQueue[beat].push(noteObj);
  }

  let currentBeat = -1;
  let currentMeasure = -1;
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
          beatInfo.note.scrollIntoView();
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
              item => item && item[0] && item[0].measure == target
            );
            if (newBeat !== -1) {
              currentBeat = newBeat;
            }// TODO: else 0?
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
      return;
    }
  }

  function start() {
    met.play();
  }
</script>

<Metronome
  bind:this={met}
  on:beat={onBeat}
  {tempo}
  {timeNumerator}
  {timeDenominator}
/>

<button on:click={start}>start/stop</button>

{@html svg}

<style>
  :global(.activeNote),
  :global(.activeNote path),
  :global(.activeNote g) {
    filter: invert(29%) sepia(82%) saturate(4448%) hue-rotate(174deg)
      brightness(60%) contrast(101%);
  }
</style>
