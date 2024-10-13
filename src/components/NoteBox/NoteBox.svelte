<script>
  // Box for displaying notes from musicXML (SVG format)
  import { createEventDispatcher, onMount } from 'svelte';
  import Loading from '../Loading/Loading.svelte';
  import Metronome from '../Metronome/Metronome.svelte';
  import { getMetronomeDefault } from './metronomeDefaults';
  import { logPerfStats } from '../utils/logging';
  import {
    extractNoteMetaData,
    extractMeasureData,
    extractUpbeatTime,
    tempoUnitAsNumber,
    numberToTempoUnit,
    STANDARD_BPM,
  } from '../../lib/osmd_helpers';
  import { getNoteNameByPitch } from '../../lib/notes';
  const dispatch = createEventDispatcher();

  export let project;
  export let trackName = null;
  export let audioContext;
  export let hasPartFile = false;
  export let meta = [];

  const SVGNS = 'http://www.w3.org/2000/svg';

  let sheetMusicRenderer; // OSMD instance
  let sheetmusicElm;
  let renderingMusic = true;
  // stuff metronome needs
  // many of these are re-set in the setGlobalMetronomeVars method
  let metronome;
  let beatUnit = 'quarter';
  let dotted = false;
  let bpm = STANDARD_BPM;
  let timeNumerator = 4;
  let timeDenominator = 4;
  let beatUnitNumber = tempoUnitAsNumber(beatUnit);
  let nthBeatSounded = (timeDenominator / beatUnitNumber) * (dotted ? 1.5 : 1);
  let delayBetweenBeats = 60 / bpm / nthBeatSounded;
  let cachedMetronomeSettings = {};
  // cursor movement stuff
  let upbeat = 0;
  let measureList;
  let noteData;
  let repeats = [];
  let svg = '';
  let loadingMessage = 'Henter notene...';
  let startTime;
  let scrolling = false;
  let navbarHeight;
  let targetScrollPosition;
  let firstMeasureYPos;
  // Enable feature sending generated SVG files to server
  const OPT_SAVE_GENERATED_SVG = false;
  const timeStart = Date.now();
  // highlighting collapsed pause measures
  let nthCollapsedPauseMeasure;
  let collapsedPauseHiliElm;
  let renderedCollapsedMeasure;

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
  // onBeat: if event.detail.countdown do nothing (well, perhaps upbeat..)
  // if measureCount >= measures.length, tune finished
  // if jump, set measureCount (again!)
  // if new measure and time signature different, change it
  // trigger & schedule note movements according to beat queue entry

  onMount(async function () {
    //const module = await import('opensheetmusicdisplay');
    loadingMessage = 'Henter notene...';
    let request;
    let perfmeasure = Date.now();
    if (hasPartFile) {
      request = await fetch(
        `/api/project/${project._id}/score/${
          trackName ? encodeURIComponent(trackName) : ''
        }/svg`,
        { credentials: 'same-origin' }
      );
      svg = await request.text();
    }
    let markup;
    if (request && request.ok && svg && svg.indexOf('data-') > -1) {
      // ..can we trust this SVG?
    } else {
      svg = '';
      if (sessionStorage.getItem(project._id + '/' + trackName)) {
        markup = await Promise.resolve(
          sessionStorage.getItem(project._id + '/' + trackName)
        );
      } else {
        request = await fetch(
          `/api/project/${project._id}/score/${
            trackName ? encodeURIComponent(trackName) : ''
          }`,
          { credentials: 'same-origin' }
        );
        markup = await request.text();
        sessionStorage.setItem(project._id + '/' + trackName, markup);
      }
    }
    logPerfStats({
      measurement: 'fetch-music-partfile',
      project: project._id,
      ms: Date.now() - perfmeasure,
    });
    loadingMessage = 'Tilpasser notene til din skjerm...';
    let zoom = 1;
    if (window.innerWidth <= 480) {
      zoom = 0.75;
    }
    if (markup) {
      perfmeasure = Date.now();
      sheetMusicRenderer = new opensheetmusicdisplay.OpenSheetMusicDisplay(
        sheetmusicElm,
        {
          autoResize: false, // important! OSMD must not redraw notes with new IDs
          backend: 'svg',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawPartNames: false,
          drawMetronomeMarks: true,
          disableCursor: true,
        }
      );
      await sheetMusicRenderer.load(markup);
      sheetMusicRenderer.zoom = zoom; // must be after load() for some reason
      sheetMusicRenderer.EngravingRules.RenderRehearsalMarks = false; // Workaround because Flute voices get marks intended for the full score
      sheetMusicRenderer.render();
      console.log('render done');
      logPerfStats({
        measurement: 'render-music-osmd',
        project: project._id,
        ms: Date.now() - perfmeasure,
      });

      if (
        OPT_SAVE_GENERATED_SVG &&
        window.innerWidth >= 768 &&
        window.innerWidth <= 1280
      ) {
        console.log('window size ok-Ish');
        await saveSVGToServer();
        console.log('saved!');
      }
      top.osmd = sheetMusicRenderer; // Debug. TODO: remove
    }
    renderingMusic = false;
    let hasElm = Boolean(document.getElementsByTagName('svg')[0]);
    console.log('render time: ' + (Date.now() - timeStart) + 'ms', hasElm);
    let navs = document.getElementsByTagName('nav');
    navbarHeight = navs[0].offsetHeight;
    for (let i = 0; i < navs.length; i++) {
      navbarHeight = Math.max(
        navbarHeight,
        navs[i].getBoundingClientRect().bottom
      );
    }
  });

  function initMusicData() {
    // This code needs to deal with units. Mainly three types of units:
    // measures, beats and seconds

    // Fall back to default slow inital bpm in case the note does not
    // have metronome info to start with
    bpm = STANDARD_BPM;
    let svgElm = sheetmusicElm.getElementsByTagName('svg')[0];
    repeats.length = 0;
    if (svgElm.dataset.measureList) {
      // measureList comes from the server, but we'll augment it per data model
      measureList = JSON.parse(svgElm.dataset.measureList);
      repeats = JSON.parse(svgElm.dataset.repeats);
      noteData = JSON.parse(svgElm.dataset.noteData);
      upbeat = parseFloat(svgElm.dataset.upbeat);
    } else {
      let temp = extractMeasureData(sheetMusicRenderer);
      measureList = temp.measureList;
      repeats = temp.repeats;
      noteData = extractNoteMetaData(sheetMusicRenderer);
      upbeat = extractUpbeatTime(sheetMusicRenderer);
      if (OPT_SAVE_GENERATED_SVG && !svg) {
        // include meta data when saving generated SVG to server..
        svgElm.setAttribute('data-measure-list', JSON.stringify(measureList));
        svgElm.setAttribute('data-note-data', JSON.stringify(noteData));
        svgElm.setAttribute('data-repeats', JSON.stringify(repeats));
        svgElm.setAttribute('data-upbeat', JSON.stringify(upbeat));
      }
    }
    setGlobalMetronomeVars(measureList[0]);
    // turn repeat data into jump instructions
    // CAVEAT: OSMD might change representation of repeat data?
    let repeatStarts = [];
    repeats.forEach((repeat, idx) => {
      if (repeat.type === 0) {
        // start of repetition - |:
        repeatStarts.push(repeat);
      } else if (repeat.type === 2) {
        // end of repetition - :|
        let jpmIdx = repeat.measureIndex;
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
    // one *complete* measure is timeNumerator beats
    // Caveat: we may have a first *incomplete* measure in case of upbeats
    // Beat duration - unit here is measures. No seconds involved yet..
    let beatDuration = 1 / timeNumerator; // 0.25 for 4/4, 0.125 for 6/8 ..
    let notes = document.getElementsByClassName('vf-stavenote');
    let beatInMeasure = 0;
    // Go through the actual SVG note elements and match
    // them to measures using meta data.
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      if (!noteData[note.id]) {
        console.error('no data for note?');
        continue;
      }
      let start = parseFloat(noteData[note.id].timeStart); // in fractions of measure
      let measureIndex = parseInt(noteData[note.id].measure);
      let measure = measureList[measureIndex];
      if (!measure) {
        console.warn('no measure for index ' + measureIndex);
        continue;
      }
      // pick up changing time signatures..
      if (measure.timeSignature) {
        beatDuration = 1 / measure.timeSignature.numerator;
      }

      // Important: if it's the first measure and it is an upbeat,
      // we need to calculate the timing of the note from the *end*
      // of the measure.
      if (upbeat && measureIndex === 0) {
        const normalMeasureDuration = timeNumerator / timeDenominator;
        // this is an upbeat note. The metronome logic will pretend it is a normal,
        // full measure, so shift the timing accordingly towards the end
        start += normalMeasureDuration - upbeat;
        measure.duration = normalMeasureDuration;
      }

      // which beat in *this* measure is the note played for?
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

    console.log(measureList);
  }

  function pushQueue(measure, beat, noteObj) {
    if (!measure.beats[beat]) {
      measure.beats[beat] = [];
    }
    measure.beats[beat].push(noteObj);
  }

  function highlightBeat(measureIdx, beatIdx, firstBeatInMeasure) {
    if (measureList[measureIdx] && measureList[measureIdx].beats[beatIdx]) {
      if (collapsedPauseHiliElm) {
        clearCollapsedHighlight();
      }
      for (let i = 0; i < measureList[measureIdx].beats[beatIdx].length; i++) {
        let beatInfo = measureList[measureIdx].beats[beatIdx][i];

        if (beatInfo.delay) {
          highlightAfterDelay(beatInfo.delay, beatInfo.note);
        } else {
          clearHighlight();
          beatInfo.note.classList.add('activeNote');
          scrollIfRequired(measureIdx);
        }
      }
    } else if (
      measureList[measureIdx] &&
      measureList[measureIdx].isReducedToMultiRest
    ) {
      if (!collapsedPauseHiliElm) {
        renderedCollapsedMeasure = measureList[measureIdx];
        nthCollapsedPauseMeasure = 0;
        collapsedPauseHiliElm = addMeasureRect(measureIdx, 'staffOverlay');
        scrollIfRequired(measureIdx);
      }
      if (firstBeatInMeasure) {
        nthCollapsedPauseMeasure++;
      }
      collapsedPauseHiliElm.setAttribute(
        'width',
        (renderedCollapsedMeasure.width /
          renderedCollapsedMeasure.numberOfMeasures) *
          nthCollapsedPauseMeasure
      );
    }
  }

  function addMeasureRect(num, clsName) {
    let measureData = measureList[num];
    if (!measureData) {
      return console.error('no data for overlay for' + num);
    }
    if (!(measureData.x && measureData.y)) {
      return;
    }
    let rect = document.createElementNS(SVGNS, 'rect');
    if (clsName) {
      rect.setAttribute('class', clsName);
    } else {
      rect.setAttribute('class', 'measureOverlay');
      rect.setAttribute('id', 'overlay_' + num);
    }
    rect.setAttribute('x', measureData.x);
    rect.setAttribute('y', measureData.y);
    rect.setAttribute('height', measureData.height);
    rect.setAttribute('width', measureData.width);
    document.getElementsByTagName('svg')[0].appendChild(rect);
    return rect;
  }

  function clearHighlight() {
    let oldElms = document.getElementsByClassName('activeNote');
    for (let i = oldElms.length - 1; i >= 0; i--) {
      if (oldElms[i]) {
        oldElms[i].classList.remove('activeNote');
      }
    }
  }

  function clearCollapsedHighlight() {
    if (collapsedPauseHiliElm) {
      collapsedPauseHiliElm.parentNode.removeChild(collapsedPauseHiliElm);
      collapsedPauseHiliElm = null;
      nthCollapsedPauseMeasure = null;
      renderedCollapsedMeasure = null;
    }
  }

  function highlightAfterDelay(delay, note) {
    let msPerMeasure =
      (60 / bpm / (timeDenominator / beatUnitNumber)) *
      (dotted ? 1.5 : 1) *
      timeNumerator *
      1000;
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
    // RecordUI will count visually down
    // It only cares about the beats with audible pulse though..
    if (evt.detail.countdown && evt.detail.hasPulse) {
      dispatch('countdown', Object.assign({}, evt.detail));
      meta.push({
        event: 'countdown',
        measure: measureCount,
        time: audioContext.currentTime - startTime,
      });
      //Update startTime while count-down,
      // because we want it to be the time when music starts
      startTime = audioContext.currentTime;
      if (measureCount < 0) {
        return; // nothing to do here
      }
    }
    let measure = measureList[measureCount];
    if (!measure) {
      if (measureCount >= measureList.length) {
        // we're at the last measure, but does it end with a jump?
        if (
          !(
            measureList[previousMeasure] &&
            measureList[previousMeasure].jumps &&
            measureList[previousMeasure].jumps.length
          )
        ) {
          dispatch('ended');
          metronome.stop();
          clearHighlight();
          return;
        }
      }
    }
    let newMeasure = false;
    if (previousMeasure !== measureCount) {
      // we're entering a new measure
      // check if the previous measure ends with a jump
      if (
        measureList[previousMeasure] &&
        measureList[previousMeasure].jumps.length
      ) {
        measureCount = measureList[previousMeasure].jumps.shift();
        measure = measureList[measureCount];
        metronome.jumpToMeasure(measureCount);
      }
      setGlobalMetronomeVars(measure);
      // if this is a multi-rest measure, we have no new notes
      // to highlight but still want to remove the old one
      clearHighlight();
      // Insert an overlay to help with the scroll calculations
      let oldelm = document.getElementById('overlay_' + previousMeasure);
      let newelm =
        document.getElementById('overlay_' + measureCount) ||
        addMeasureRect(measureCount);
      if (newelm && oldelm) {
        oldelm.parentNode.removeChild(oldelm);
      }
      if (newelm && !firstMeasureYPos) {
        firstMeasureYPos = newelm.getBoundingClientRect().y;
      }
      if (measureCount % 2 === 0) {
        meta.push({
          event: 'measurestart',
          measure: measureCount,
          predictedTime: measure.startsAtMs,
          time: audioContext.currentTime - startTime,
        });
        console.log(meta[meta.length - 1]);
        dispatch('measuretime', { time: audioContext.currentTime - startTime });
      }
      newMeasure = true;
    }

    highlightBeat(measureCount, evt.detail.beatInMeasure, newMeasure);
    previousMeasure = measureCount;
    // tempo change is hard because the metronome schedules beats in advance
    // if we set the tempo when the new measure starts, it may be too later
    if (evt.detail.beatInMeasure === timeNumerator - 1) {
      // last beat.. lookahead check to see if metronome instructions change
      if (measureList[measureCount + 1] || measureList[measureCount].jumps[0]) {
        let nextMeasure =
          measureList[measureList[measureCount].jumps[0]] ||
          measureList[measureCount + 1];
        if (nextMeasure) {
          setGlobalMetronomeVars(nextMeasure);
        }
      }
    }
  }

  function setGlobalMetronomeVars(measure) {
    // did the time signature change?
    let tsChanged = false;
    let oldMeter;
    if (
      measure.timeSignature &&
      (measure.timeSignature.numerator !== timeNumerator ||
        measure.timeSignature.denominator !== timeDenominator)
    ) {
      oldMeter = `${timeNumerator}/${timeDenominator}`;
      timeNumerator = measure.timeSignature.numerator;
      timeDenominator = measure.timeSignature.denominator;
      tsChanged = true;
      console.log(`${timeNumerator}/${timeDenominator}`);
    }
    // detect tempo changes
    if (measure.metronome) {
      // Svelte makes these changes cascade somewhat, it's good for performance
      // to check if they really change before assignment
      if (
        bpm !== measure.metronome.bpm ||
        beatUnit !== measure.metronome.beatUnit ||
        dotted !== measure.metronome.dotted
      ) {
        bpm = measure.metronome.bpm;
        beatUnit = measure.metronome.beatUnit;
        dotted = [true, 'true'].includes(measure.metronome.dotted);
        console.log('tempo settings changed! New: ', measure.metronome);

        beatUnitNumber = tempoUnitAsNumber(beatUnit);
        nthBeatSounded =
          (timeDenominator / beatUnitNumber) * (dotted ? 1.5 : 1);
        delayBetweenBeats = 60 / bpm / nthBeatSounded;
      }
    } else if (tsChanged) {
      // whoa, the time signature just changed but the
      // metronome info did not. We may want to go for
      // default values for the new meter..
      let maybeValues =
        cachedMetronomeSettings[`${timeNumerator}/${timeDenominator}`] ||
        getMetronomeDefault(timeNumerator, timeDenominator);
      if (
        beatUnitNumber !== maybeValues.beatUnitNumber ||
        dotted !== maybeValues.dotted ||
        nthBeatSounded !== maybeValues.nthBeatSounded
      ) {
        // we're really changing here.. right!
        cachedMetronomeSettings[oldMeter] = {
          beatUnit,
          beatUnitNumber,
          dotted,
          nthBeatSounded,
        };
        beatUnit = numberToTempoUnit(maybeValues.beatUnitNumber);
        nthBeatSounded = maybeValues.nthBeatSounded;
        dotted = maybeValues.dotted;
        beatUnitNumber = maybeValues.beatUnitNumber;
        delayBetweenBeats = 60 / bpm / nthBeatSounded;
      }
    }
  }

  export function initPlaythrough() {
    document.documentElement.scrollTop = 0;
    // init music data every time (repeats are "used" when cursor goes through data)
    // TODO: for better performance, only re-init repeats..
    initMusicData();
    startTime = audioContext.currentTime;
    metronome.play(upbeat, nthBeatSounded, timeNumerator);
  }
  export function stopPlaythrough() {
    metronome.stop();
    clearHighlight();
    clearCollapsedHighlight();
  }

  function scrollIfRequired(measureIndex) {
    if (scrolling) {
      return;
    }
    let elm = document.getElementById('overlay_' + measureIndex);
    if (!elm) {
      console.error('No element ' + measureIndex);
      return;
    }
    let rect = elm.getBoundingClientRect();

    let needsScrollUp = rect.y < navbarHeight * 1.1;
    let needsScrollDown = !needsScrollUp && rect.y > firstMeasureYPos * 1.1;
    if (needsScrollUp || needsScrollDown) {
      targetScrollPosition = needsScrollDown
        ? rect.y -
          firstMeasureYPos +
          document.documentElement.scrollTop +
          rect.height
        : document.documentElement.scrollTop -
          navbarHeight -
          Math.abs(rect.y) -
          rect.height;

      if (needsScrollUp) {
        // we're jumping back..
        document.body.style.scrollBehavior = 'smooth';
        document.documentElement.scrollTop = targetScrollPosition;
        scrolling = false;
        document.body.style.scrollBehavior = '';
        return;
      }
      scrolling = true;
      let steps =
        (targetScrollPosition - document.documentElement.scrollTop) / 10;
      function scrollStep() {
        document.documentElement.scrollTop += steps;
        if (
          diff(
            document.documentElement.scrollHeight -
              document.documentElement.scrollTop,
            window.innerHeight
          ) <= Math.abs(steps)
        ) {
          // end of document
          scrolling = false;
        }
        if (
          scrolling &&
          diff(document.documentElement.scrollTop, targetScrollPosition) >
            Math.abs(steps * 1.2)
        ) {
          setTimeout(scrollStep, 10);
        } else {
          scrolling = false;
        }
      }
      scrollStep();
    }
  }
  function diff(a, b) {
    return Math.abs(a - b);
  }

  function saveSVGToServer() {
    initMusicData();
    let svgElm = sheetmusicElm.getElementsByTagName('svg')[0];
    return fetch(
      `/api/project/${project._id}/score/${encodeURIComponent(trackName)}`,
      {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ svgMarkup: svgElm.outerHTML }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  function getAllNotesInPiece() {
    const notes = [];
    sheetMusicRenderer.graphic.MeasureList.forEach(outerList => {
      if (!outerList) {
        return;
      }
      outerList.forEach(innerList => {
        if (innerList && innerList.staffEntries) {
          innerList.staffEntries.forEach(staffEntry => {
            staffEntry.graphicalVoiceEntries.forEach(voiceEntry => {
              voiceEntry.notes.forEach(note => {
                console.log(note, note.sourceNote.Pitch);
                if (note.sourceNote && note.sourceNote.Pitch) {
                  const noteWithOctave = getNoteNameByPitch(
                    note.sourceNote.Pitch.frequency
                  );
                  if (!notes.includes(noteWithOctave)) {
                    notes.push(noteWithOctave);
                  }
                }
              });
            });
          });
        }
      });
    });
    return notes;
  }

  export function loadCustomHitNoteGame() {
    const notes = getAllNotesInPiece();
    const url = `/lek/treffnoten?noter=${notes.join(',')}`;
    top.location.href = url;
  }

  let winHeight;
</script>

<svelte:window bind:innerHeight={winHeight} />

{#if audioContext}
  <Metronome
    bind:this={metronome}
    {timeNumerator}
    {nthBeatSounded}
    {delayBetweenBeats}
    {audioContext}
    on:beat={onBeat}
  />
{/if}
{#if renderingMusic}
  <div class="loading">
    <Loading
      message={loadingMessage}
      subMessage="Husk å bruke høretelefoner!"
    />
  </div>
{/if}
<div class="note-box" bind:this={sheetmusicElm} id="sheetmusic">
  {#if svg}
    {@html svg}
  {/if}
</div>

<style>
  :global(.activeNote),
  :global(.activeNote path),
  :global(.activeNote g) {
    filter: invert(29%) sepia(82%) saturate(4448%) hue-rotate(174deg)
      brightness(60%) contrast(101%);
    -webkit-filter: invert(29%) sepia(82%) saturate(4448%) hue-rotate(174deg)
      brightness(60%) contrast(101%);
    fill: #00994a;
    stroke: #00994a;
  }

  :global(svg) {
    max-width: 100%;
  }
  :global(.staffOverlay) {
    fill: #00994a;
    fill-opacity: 0.15;
  }
  :global(.measureOverlay) {
    fill: none;
    stroke: none;
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
