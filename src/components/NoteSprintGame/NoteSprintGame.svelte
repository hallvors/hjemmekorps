<script>
  // TODO:
  // real support for F-nøkkel
  // Show band streak, band points in page
  // fortegn!
  // longer durations for older members?

  import { onMount } from 'svelte';
  export let band;
  export let user;
  import { Vex, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
  import UsageHint from '../UsageHint/UsageHint.svelte';
  import Star from '../Star/Star.svelte';
  import PointsRenderer from '../PointsRenderer/PointsRenderer.svelte';
  import Button from '../Button/Button.svelte';
  import { getRandomInt, rectsOverlap } from '../../lib/utils';
  import { autoCorrelate } from '../../lib/pitch';
  import { instruments } from '../../lib/datastore';

  const noteNameFrequencyMappingNatural = {
    C2: 65.41,
    'C#2': 69.3,
    D2: 73.42,
    'D#2': 77.78,
    E2: 82.41,
    F2: 87.31,
    'F#2': 92.5,
    G2: 98.0,
    'G#2': 103.83,
    A2: 110.0,
    'A#2': 116.54,
    B2: 123.47,

    C3: 130.81,
    'C#3': 138.59,
    D3: 146.83,
    'D#3': 155.56,
    E3: 164.81,
    F3: 174.61,
    'F#3': 185.0,
    G3: 196.0,
    'G#3': 207.65,
    A3: 220.0,
    'A#3': 233.08,
    B3: 246.94,

    C4: 261.63,
    'C#4': 277.18,
    D4: 293.66,
    'D#4': 311.13,
    E4: 329.63,
    F4: 349.23,
    'F#4': 369.99,
    G4: 392.0,
    'G#4': 415.3,
    A4: 440.0,
    'A#4': 466.16,
    B4: 493.88,

    C5: 523.25,
    'C#5': 554.37,
    D5: 587.33,
    'D#5': 622.25,
    E5: 659.26,
    F5: 698.46,
    'F#5': 739.99,
    G5: 783.99,
    'G#5': 830.61,
    A5: 880.0,
    'A#5': 932.33,
    B5: 987.77,

    C6: 1046.5,
    'C#6': 1108.73,
    D6: 1174.66,
    'D#6': 1244.51,
    E6: 1318.51,
    F6: 1396.91,
    'F#6': 1479.98,
    G6: 1567.98,
    'G#6': 1661.22,
    A6: 1760.0,
    'A#6': 1864.66,
    B6: 1975.53,
  };
  const octaveSplits = [0, 0];
  const noteAndOctaveNames = Object.keys(noteNameFrequencyMappingNatural);
  noteAndOctaveNames.forEach((key, idx) => {
    if (idx > 1 && idx % 12 === 0) {
      octaveSplits.push(
        (noteNameFrequencyMappingNatural[key] +
          noteNameFrequencyMappingNatural[noteAndOctaveNames[idx - 1]]) /
          2
      );
    }
  });
  function selectConcertPitchOctave(hz) {
    return octaveSplits.findIndex(num => num > hz);
  }
  let sheetmusicElm;
  let availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const selectedNotes = [];
  const MODES = { CONFIGURE: 1, TUNE: 2, PLAY: 3 };
  let mode = MODES.CONFIGURE;
  let celebrate = false;
  let octaves;
  let renderer, context, stave, width, drawNoteVisual;
  let currentTaskNote, nowPlayingNote, nowPlayingOctave;
  let analyser, audioContext, source;
  let hits = [];
  let points = 0;
  let serverData;
  let saveTimeout;
  // we persist points to server no later than 15 sec after last correct note
  // (we also save every immediately after every 10th correct note)
  const SAVE_DELAY_MS = 15000;
  let userInstrument;
  let cndLassoPositions = {};

  function drawConfigNotes(noteNames, octaves, instrument) {
    if (context) {
      context.clear();
    }
    stave = new Stave(0 /* x */, 0 /* y */, width /* width */);
    const clef = instrument.clef ? instrument.clef : 'treble';
    stave.addClef(clef);
    stave.setContext(context).draw();
    const voice = new Voice({
      num_beats: availableNotes.length * octaves.length,
      beat_value: 4,
    });
    const notes = [];
    octaves.forEach(octave => {
      noteNames.forEach(note => {
        const valueWithOctave = `${note}/${octave}`;
        const staveNote = new StaveNote({
          keys: [valueWithOctave],
          clef,
          duration: 'q',
        });
        const isActive = selectedNotes.includes(valueWithOctave);
        staveNote.setStyle({
          fillStyle: isActive ? 'var(--activeNoteColor)' : 'grey',
          strokeStyle: isActive ? 'var(--activeNoteColor)' : 'grey',
        });
        staveNote.setAttribute('data-notevalue', valueWithOctave);
        notes.push(staveNote);
      });
    });

    voice.addTickables(notes);

    Accidental.applyAccidentals([voice], 'C');
    new Formatter().joinVoices([voice]).format([voice], width * 0.75);

    voice.draw(context, stave);
    notes.forEach(note =>
      note
        .getSVGElement()
        .setAttribute('data-notevalue', note.getAttribute('data-notevalue'))
    );
  }

  onMount(async function () {
    userInstrument = $instruments.find(
      instr => instr.value === user.instrument
    );
    console.log({ userInstrument });
    /*
    switch(userInstrument.key) {
      case 'Bb':
        availableNotes = ['Bb', 'C', 'D', 'E', 'F', 'G', 'A']
    }
    */
    width = Math.min(sheetmusicElm.offsetWidth * 0.9, window.innerWidth);
    const { Renderer } = Vex.Flow;
    renderer = new Renderer(sheetmusicElm, Renderer.Backends.SVG);
    renderer.resize(width, 250);
    context = renderer.getContext();
    octaves = userInstrument.clef === 'bass' ? [2, 3, 4] : [4, 5];
    drawConfigNotes(availableNotes, octaves, userInstrument);

    // Initiate click-and-drag to select notes
    function cndSelectNotesInit(evt) {
      if (mode !== MODES.CONFIGURE) {
        return;
      }
      console.log({ selectedNotes });
      let elm = evt.target;
      let insideSvg = elm.tagName === 'svg'; // to enable Dnd only over SVG
      while (elm && elm.dataset && !elm.dataset.notevalue && !insideSvg) {
        elm = elm.parentElement;
        if (elm && elm.tagName === 'svg') {
          insideSvg = true;
        }
      }
      if (elm && elm.dataset && elm.dataset.notevalue) {
        // we clicked a note!
        if (selectedNotes.includes(elm.dataset.notevalue)) {
          selectedNotes.splice(selectedNotes.indexOf(elm.dataset.notevalue), 1);
        } else {
          selectedNotes.push(elm.dataset.notevalue);
        }
        evt.preventDefault();
        drawConfigNotes(availableNotes, octaves, userInstrument);
      } else if (insideSvg) {
        // init click-and-drag
        cndLassoPositions = {
          x: evt.clientX,
          y: evt.clientY,
          width: 0,
          height: 0,
        };
        evt.preventDefault();
        if (evt.type === 'touchstart') {
          sheetmusicElm.addEventListener('touchcancel', cndStop, true);
          sheetmusicElm.addEventListener('touchend', cndStop, true);
          sheetmusicElm.addEventListener('touchmove', cndMoveSelectNotes, true);
        }
      }
    }
    sheetmusicElm.addEventListener('touchstart', cndSelectNotesInit, true);
    sheetmusicElm.addEventListener('mousedown', cndSelectNotesInit, true);
    function cndStop(evt) {
      if (cndLassoPositions.x !== undefined) {
        cndLassoPositions = {};
        evt.preventDefault();
        if (/^touch/.test(evt.type)) {
          sheetmusicElm.removeEventListener('touchcancel', cndStop, true);
          sheetmusicElm.removeEventListener('touchend', cndStop, true);
          sheetmusicElm.removeEventListener('touchmove', cndMoveSelectNotes, true);

        }
      }
    }
    sheetmusicElm.addEventListener('mouseup', cndStop, true);
    function cndMoveSelectNotes(evt) {
      if (cndLassoPositions.x !== undefined) {
        // We don't support right-to-left selections, sorry
        if (
          evt.clientX < cndLassoPositions.x ||
          evt.clientY < cndLassoPositions.y
        ) {
          cndLassoPositions = {};
          return;
        }
        cndLassoPositions.width = evt.clientX - cndLassoPositions.x;
        cndLassoPositions.height = evt.clientY - cndLassoPositions.y;
        const elms = document.querySelectorAll('[data-notevalue]');
        let changed;
        for (let i = 0; i < elms.length; i++) {
          const coords = elms[i].getBoundingClientRect();
          const overlap = rectsOverlap(cndLassoPositions, coords);
          if (overlap) {
            if (!selectedNotes.includes(elms[i].dataset.notevalue)) {
              selectedNotes.push(elms[i].dataset.notevalue);
              changed = true;
            }
          } else if (selectedNotes.includes(elms[i].dataset.notevalue)) {
            selectedNotes.splice(
              selectedNotes.indexOf(elms[i].dataset.notevalue),
              1
            );
            changed = true;
          }
        }
        if (changed) {
          drawConfigNotes(availableNotes, octaves, userInstrument);
        }
        evt.preventDefault();
        return false;
      }
    }
    sheetmusicElm.addEventListener('mousemove', cndMoveSelectNotes, true);

    serverData = await (
      await fetch('/api/games/note-sprint', { credentials: 'same-origin' })
    ).json();
    points = serverData.userPointsToday || 0;
    console.log({ serverData });
  });

  function savePoints(points) {
    return fetch('/api/games/note-sprint', {
      credentials: 'same-origin',
      method: 'post',
      body: JSON.stringify({ points }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  function startGame() {
    if (selectedNotes.length === 0) {
      return alert('Du må velge noter først!');
    }
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.minDecibels = -100;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    if (!navigator?.mediaDevices?.getUserMedia) {
      // No audio allowed
      alert(
        'Du prøver å bruke en digital dings der vi ikke får tilgang til mikrofonen :('
      );
      return;
    } else {
      var constraints = { audio: true };
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          // Initialize the SourceNode
          source = audioContext.createMediaStreamSource(stream);
          // Connect the source node to the analyzer
          source.connect(analyser);
          drawNote();
        })
        .catch(function (err) {
          console.error(err);
          alert(
            'Ops.. om vi ikke får tilgang til mikrofonen, virker det ikke.'
          );
        });
    }
    mode = MODES.PLAY;
    nextTask();
  }

  var noteStrings = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];
  function noteFromPitch(frequency) {
    var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  var drawNote = function () {
    drawNoteVisual = requestAnimationFrame(drawNote); // TODO: too often??
    var bufferLength = analyser.fftSize;
    var buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    var autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate); //hz

    // Handle rounding
    var valueToDisplay = autoCorrelateValue;
    valueToDisplay = Math.round(valueToDisplay);
    console.log(autoCorrelateValue);
    if (autoCorrelateValue === -1) {
      //        document.getElementById('note').innerText = 'Too quiet...';
      nowPlayingNote = null;
      drawTask();
      return;
    }

    // transposing instrument? Change value to the Hz value
    // corresponding to the note we actually want to see on
    // the screen..
    if (userInstrument.transpose) {
      const obj = {
        preHz: autoCorrelateValue,
        preHzNote: noteStrings[noteFromPitch(autoCorrelateValue) % 12],
      };
      autoCorrelateValue *= userInstrument.transpose;
      obj.postHz = autoCorrelateValue;
      obj.postHzNote = noteStrings[noteFromPitch(autoCorrelateValue) % 12];
      console.log(obj);
    }
    // we also need octave info
    nowPlayingOctave = selectConcertPitchOctave(autoCorrelateValue);

    nowPlayingNote = noteStrings[noteFromPitch(autoCorrelateValue) % 12];

    console.log({
      nowPlayingNote,
      nowPlayingOctave,
      currentTaskNote,
      hits: hits.length,
    });

    if (
      `${nowPlayingNote}/${nowPlayingOctave}` === currentTaskNote &&
      !celebrate
    ) {
      // nice work! but maybe have to hold it for some duration??
      hits.push(1);
      if (hits.length > 50) {
        // TODO: longer for older members!
        points++;
        // we save data to server for each 10th point or after
        // a given deadline
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          savePoints(points);
        }, SAVE_DELAY_MS);
        if (points % 10 === 0) {
          clearTimeout(saveTimeout);
          savePoints(points);
        }
        celebrate = true;
        setTimeout(() => {
          celebrate = false;
          nextTask();
        }, 500);
        return;
      }
    }

    //      if (smoothingValue === 'none') {
    //        smoothingThreshold = 99999;
    //        smoothingCountThreshold = 0;
    //      } else if (smoothingValue === 'basic') {
    //        smoothingThreshold = 10;
    //        smoothingCountThreshold = 5;
    //      } else if (smoothingValue === 'very') {
    //        smoothingThreshold = 5;
    //        smoothingCountThreshold = 10;
    //      }
    //      function noteIsSimilarEnough() {
    //        // Check threshold for number, or just difference for notes.
    //        if (typeof(valueToDisplay) == 'number') {
    //          return Math.abs(valueToDisplay - previousValueToDisplay) < smoothingThreshold;
    //        } else {
    //          return valueToDisplay === previousValueToDisplay;
    //        }
    //      }
    //      // Check if this value has been within the given range for n iterations
    //      if (noteIsSimilarEnough()) {
    //        if (smoothingCount < smoothingCountThreshold) {
    //          smoothingCount++;
    //          return;
    //        } else {
    //          previousValueToDisplay = valueToDisplay;
    //          smoothingCount = 0;
    //        }
    //      } else {
    //        previousValueToDisplay = valueToDisplay;
    //        smoothingCount = 0;
    //        return;
    //      }
    //      if (typeof(valueToDisplay) == 'number') {
    //        valueToDisplay += ' Hz';
    //      }
    drawTask();
  };

  function nextTask() {
    let num = getRandomInt(0, selectedNotes.length - 1);
    hits.length = 0;
    // Try to avoid the same note twice in a row
    if (selectedNotes.length > 1) {
      while (selectedNotes[num] === currentTaskNote) {
        num = getRandomInt(0, selectedNotes.length - 1);
      }
    }
    currentTaskNote = selectedNotes[num];
    console.log(currentTaskNote);
  }
  function drawTask() {
    const npNoteValue =
      nowPlayingNote && nowPlayingOctave > 1
        ? `${nowPlayingNote}/${nowPlayingOctave}`
        : null;
    const isCorrect = npNoteValue === currentTaskNote;
    const clef = userInstrument.clef || 'treble';
    context.clear();
    stave = new Stave(0 /* x */, 0 /* y */, width /* width */);
    stave.addClef(clef);
    stave.setContext(context).draw();
    const voice = new Voice({
      num_beats: 1,
      beat_value: 4,
    });
    const taskNote = new StaveNote({
      keys: [currentTaskNote],
      clef,
      duration: 'q',
      align_center: true,
    });
    taskNote.setStyle({
      fillStyle: isCorrect ? 'green' : 'black',
      strokeStyle: isCorrect ? 'green' : 'black',
    });

    voice.addTickables([taskNote]);

    Accidental.applyAccidentals([voice], 'C');
    new Formatter().joinVoices([voice]).format([voice], width * 0.8);

    voice.draw(context, stave);

    if (!isCorrect && npNoteValue) {
      const npVoice = new Voice({
        num_beats: 1,
        beat_value: 4,
      });
      npVoice.addTickables([
        new StaveNote({
          keys: [npNoteValue],
          clef,
          duration: 'q',
          align_center: true,
        }).setStyle({ fillStyle: 'grey', strokeStyle: 'grey' }),
      ]);
      Accidental.applyAccidentals([npVoice], 'C');
      new Formatter().joinVoices([npVoice]).format([npVoice], width * 0.8);
      npVoice.draw(context, stave);
    }
  }
  function stopGame() {
    mode = MODES.CONFIGURE;
    source.disconnect(analyser);
    cancelAnimationFrame(drawNoteVisual);
    drawConfigNotes(availableNotes, octaves, userInstrument);
    savePoints(points);
  }
</script>

{#if mode === MODES.CONFIGURE}
  <UsageHint
    message="Velg hvilke noter du vil øve på ved å klikke på hver note. Du kan også klikke og dra for å merke flere."
  />
{:else if mode === MODES.PLAY}
  <UsageHint message="Spill noten du ser!" />
{/if}

<div class="parent">
  <div bind:this={sheetmusicElm}></div>
  {#if celebrate}<div class="star"><Star /></div>{/if}
</div>
<div class="toolbar">
  {#if mode === MODES.CONFIGURE}
    <Button onClick={startGame}>Start</Button>
  {/if}
  {#if mode === MODES.PLAY}
    <Button onClick={stopGame}>Avslutt</Button>
  {/if}
</div>
{#if serverData}
  <PointsRenderer
    {points}
    subGroupName={user.subgroup}
    furtherStats={serverData}
    extraPointsSinceLoad={points - serverData.userPointsToday}
  />
{/if}

{#if cndLassoPositions.x !== undefined}<div
    class="dndLasso"
    style="
      left: {cndLassoPositions.x}px;
      top: {cndLassoPositions.y}px;
      width: {cndLassoPositions.width}px;
      height: {cndLassoPositions.height}px;
    "
  ></div>{/if}

<style type="text/css">
  .toolbar {
    text-align: center;
  }
  .parent {
    position: relative;
    overflow-x: auto;
    text-align: center;
  }
  .star {
    position: absolute;
    left: 49%;
    top: 55%;
  }
  .dndLasso {
    position: fixed;
    border: 1px dashed;
    border-color: var(--border);
  }
</style>
