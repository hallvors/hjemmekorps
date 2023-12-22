<script>
  // TODO:
  // fortegn!
  // longer durations for older members?

  import { onMount } from 'svelte';
  export let user;
  export let queryNotes;
  import {
    Vex,
    Stave,
    StaveNote,
    Voice,
    Formatter,
    Accidental,
    KeySignature,
  } from 'vexflow';
  import UsageHint from '../UsageHint/UsageHint.svelte';
  import Star from '../Star/Star.svelte';
  import Button from '../Button/Button.svelte';
  import PointsRenderer from '../PointsRenderer/PointsRenderer.svelte';
  import ProgressIndicator from '../ProgressIndicator/ProgressIndicator.svelte';
  import SendLoginLink from '../SendLoginLink/SendLoginLink.svelte';
  import {
    getRandomInt,
    rectsOverlap,
    getEvtX,
    getEvtY,
  } from '../../lib/utils';
  import {
    getNotesMappedToOctave,
    notes,
    noteNames,
    toSlashNotation,
  } from '../../lib/notes';
  import { autoCorrelate } from '../../lib/pitch';
  import { instruments } from '../../lib/datastore';

  const scales = {
    CMaj: {
      name: 'C-dur',
      notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    },
    FMaj: {
      name: 'F-dur',
      notes: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    },
    BbMaj: {
      name: 'B-dur',
      notes: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    },
    EbMaj: {
      name: 'Ess-dur',
      notes: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    },
  };

  function selectConcertPitchOctave(hz) {
    for (let i = 0; i < noteNames.length; i++) {
      if (notes[noteNames[i]] > hz) {
        // we've found the first note greater than this hz value
        // but is the hz closer to notes[i] or notes[i-1] ?
        if (hz > (notes[noteNames[i]] + notes[noteNames[i - 1]]) / 2) {
          // [i] is closest match
          return parseInt(noteNames[i].match(/\d+/)[0]);
        }
        return parseInt(noteNames[i - 1].match(/\d+/)[0]);
      }
    }
  }
  let sheetmusicElm;
  let availableNotes =
    queryNotes && queryNotes.length
      ? queryNotes
      : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  console.log({ availableNotes, queryNotes, user });
  const selectedNotes = [];
  const MODES = { CONFIGURE: 1, TUNE: 2, PLAY: 3 };
  const DIFFICULTIES = { EASY: 1, HARD: 2 };
  let difficulty;
  let mode = MODES.CONFIGURE;
  let celebrate = false;
  let octaves;
  let renderer, context, stave, width, drawNoteVisual;
  let currentTaskNote,
    nowPlayingHz,
    nowPlayingNote,
    nowPlayingOctave,
    nowPlayingRightLastTs,
    selectedScale;
  let nowPlayingRightDuration = 0;
  let analyser, audioContext, source;
  let points = 0;
  let serverData;
  let saveTimeout;
  // smoothing mike note rendering (and time calc) somewhat
  const SMOOTHING_FACTOR = 10; // how many "odd" samples to ignore if we've seen a correct note
  let ignoreImperfectionsCount = SMOOTHING_FACTOR;
  let wasCorrect = true;
  // we persist points to server no later than 15 sec after last correct note
  // (we also save every immediately after every 10th correct note)
  const SAVE_DELAY_MS = 15000;
  let userInstrument;
  let cndLassoPositions = {};

  function drawConfigNotes(noteNames, octaves, instrument) {
    if (context) {
      context.clear();
    }
    stave = new Stave(0 /* x */, 40 /* y */, width /* width */);
    const clef = instrument.clef ? instrument.clef : 'treble';
    stave.addClef(clef);
    const keySig = new KeySignature(availableNotes[0]);
    keySig.addToStave(stave);
    stave.setKeySignature(availableNotes[0]);
    stave.setContext(context).draw();
    const voice = new Voice({
      num_beats: noteNames.length * octaves.length,
      beat_value: 4,
    });
    const notes = [];

    octaves.forEach(octave => {
      getNotesMappedToOctave(noteNames, octave).forEach(valueWithOctave => {
        const staveNote = new StaveNote({
          keys: [toSlashNotation(valueWithOctave)],
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

    Accidental.applyAccidentals([voice], availableNotes[0]);
    new Formatter().joinVoices([voice]).format([voice], width * 0.9);

    voice.draw(context, stave);
    notes.forEach(note =>
      note
        .getSVGElement()
        .setAttribute('data-notevalue', note.getAttribute('data-notevalue'))
    );
  }

  onMount(async function () {
    if (!user._id) {
      return;
    }
    userInstrument = $instruments.find(
      instr => instr.value === user.instrument
    );
    console.log({ userInstrument });

    // band.groups should be in "chronological" order, later groups more advanced
    difficulty =
      user.band.groups.indexOf(user.subgroup) >= user.band.groups.length - 1
        ? DIFFICULTIES.HARD
        : DIFFICULTIES.EASY;

    width = Math.min(sheetmusicElm.offsetWidth * 0.9, window.innerWidth);
    const { Renderer } = Vex.Flow;
    renderer = new Renderer(sheetmusicElm, Renderer.Backends.SVG);
    renderer.resize(width, 150);
    context = renderer.getContext();
    octaves = userInstrument.clef === 'bass' ? [2, 3] : [4, 5];
    drawConfigNotes(availableNotes, octaves, userInstrument);

    // Initiate click-and-drag to select notes
    function cndSelectNotesInit(evt) {
      if (mode !== MODES.CONFIGURE) {
        return;
      }
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
        const x = getEvtX(evt);
        const y = getEvtY(evt);
        cndLassoPositions = {
          x,
          y,
          width: 0,
          height: 0,
        };
        if (evt.type === 'touchstart') {
          cndLassoPositions.touchId = evt.touches[0].identifier;
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
          sheetmusicElm.removeEventListener(
            'touchmove',
            cndMoveSelectNotes,
            true
          );
        }
      }
    }
    sheetmusicElm.addEventListener('mouseup', cndStop, true);
    function cndMoveSelectNotes(evt) {
      if (cndLassoPositions.x !== undefined) {
        const x = getEvtX(evt, cndLassoPositions.touchId);
        const y = getEvtY(evt, cndLassoPositions.touchId);
        // We don't support right-to-left selections, sorry
        if (x < cndLassoPositions.x || y < cndLassoPositions.y) {
          cndStop(evt);
          return;
        }

        cndLassoPositions.width = x - cndLassoPositions.x;
        cndLassoPositions.height = y - cndLassoPositions.y;
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
    cndLassoPositions = {};
    nextTask();
  }

  var noteStrings = [
    'C',
    'Db',
    'D',
    'Eb',
    'E',
    'F',
    'Gb',
    'G',
    'Ab',
    'A',
    'Bb',
    'B',
  ];
  function noteFromPitch(frequency) {
    var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  // TODO: simplify this function or combine it with drawTask
  // maybe this should be analyseInputSound and just set variables..
  var drawNote = function () {
    drawNoteVisual = requestAnimationFrame(drawNote); // TODO: too often??
    var bufferLength = analyser.fftSize;
    var buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    var autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate); //hz

    // Handle rounding
    var valueToDisplay = autoCorrelateValue;
    valueToDisplay = Math.round(valueToDisplay);
    if (autoCorrelateValue === -1) {
      nowPlayingNote = null;
      nowPlayingRightLastTs = null;
      nowPlayingHz = null;
      drawTask(false);
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
    nowPlayingHz = autoCorrelateValue;
    const diffInCents =
      1200 * Math.log2(autoCorrelateValue / notes[currentTaskNote]);

    if (Math.abs(diffInCents) <= 3) {
      ignoreImperfectionsCount = SMOOTHING_FACTOR;
      if (!celebrate) {
        if (nowPlayingRightLastTs) {
          nowPlayingRightDuration += Date.now() - nowPlayingRightLastTs;
        }
        nowPlayingRightLastTs = Date.now();
        // nice work! but maybe have to hold it for some duration??
        if (
          nowPlayingRightDuration >=
          (difficulty === DIFFICULTIES.HARD ? 3500 : 1000)
        ) {
          console.log('adding point because of ' + nowPlayingRightDuration);
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
    } else {
      ignoreImperfectionsCount--;
      // We make the now playing note less jumpy by ignoring some values if
      // we hit the note correctly earlier
      if (ignoreImperfectionsCount <= 0) {
        // more than 3 cents off more than _threshold_ times: set last TS to null
        nowPlayingRightLastTs = null;
      } else {
        if (nowPlayingRightLastTs) {
          nowPlayingRightDuration += Date.now() - nowPlayingRightLastTs;
          nowPlayingRightLastTs = Date.now();
        }
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
    drawTask(false);
  };

  function nextTask() {
    let num = getRandomInt(0, selectedNotes.length - 1);
    ignoreImperfectionsCount = SMOOTHING_FACTOR;
    // Try to avoid the same note twice in a row
    if (selectedNotes.length > 1) {
      while (selectedNotes[num] === currentTaskNote) {
        num = getRandomInt(0, selectedNotes.length - 1);
      }
    }
    nowPlayingHz =
      nowPlayingNote =
      nowPlayingOctave =
      nowPlayingRightLastTs =
        null;
    nowPlayingRightDuration = 0;
    currentTaskNote = selectedNotes[num];
    console.log({ num, currentTaskNote });
    drawTask(true);
  }

  function drawTask(starting) {
    if (!currentTaskNote) {
      return;
    }
    // TODO: for greater efficiency, if nowPlayingNote is same as last time
    // we might skip drawing things again
    const npNoteValue =
      nowPlayingNote && nowPlayingOctave > 1
        ? `${nowPlayingNote}${nowPlayingOctave}`
        : null;
    const offByHz = nowPlayingHz ? notes[npNoteValue] - nowPlayingHz : null;
    const offByHzPct = offByHz ? (offByHz / notes[npNoteValue]) * 100 : null;
    const diffInCents = nowPlayingHz
      ? 1200 * Math.log2(notes[currentTaskNote] / nowPlayingHz)
      : null;

    const isCorrect =
      difficulty === DIFFICULTIES.HARD
        ? diffInCents && Math.abs(diffInCents) <= 3
        : npNoteValue === currentTaskNote;

    if (wasCorrect && !isCorrect && !starting && ignoreImperfectionsCount > 0) {
      return; // keep old rendering
    }
    console.log({
      offByHz,
      offByHzPct,
      diffInCents,
      target: notes[currentTaskNote],
      nowPlayingRightDuration,
      isCorrect,
      npNoteValue,
      currentTaskNote,
      calcOpacity: Math.max(0.1, 1 - (Math.abs(offByHzPct) * 8) / 10),
    });

    const clef = userInstrument.clef || 'treble';
    context.clear();
    stave = new Stave(0 /* x */, 40 /* y */, width /* width */);
    stave.addClef(clef);
    const keySig = new KeySignature(availableNotes[0]);
    keySig.addToStave(stave);
    stave.setKeySignature(availableNotes[0]);
    stave.setContext(context).draw();
    const voice = new Voice({
      num_beats: difficulty === DIFFICULTIES.EASY ? 2 : 4,
      beat_value: 4,
    });
    if (currentTaskNote) {
      const taskNote = new StaveNote({
        keys: [toSlashNotation(currentTaskNote)],
        clef,
        duration: difficulty === DIFFICULTIES.EASY ? 'h' : 'w',
        align_center: true,
      });
      taskNote.setStyle({
        fillStyle: isCorrect ? '#00a4d6' : 'black',
        strokeStyle: isCorrect ? '#00a4d6' : 'black',
      });
      voice.addTickables([taskNote]);
    }
    Accidental.applyAccidentals([voice], availableNotes[0]);
    new Formatter().joinVoices([voice]).format([voice], width * 0.93);

    voice.draw(context, stave);

    if (npNoteValue) {
      const npVoice = new Voice({
        num_beats: difficulty === DIFFICULTIES.EASY ? 2 : 4,
        beat_value: 4,
      });
      const nowPlayingStaveNote = new StaveNote({
        keys: [toSlashNotation(npNoteValue)],
        clef,
        duration: difficulty === DIFFICULTIES.EASY ? 'h' : 'w',
        align_center: true,
      });

      npVoice.addTickables([nowPlayingStaveNote]);
      Accidental.applyAccidentals([npVoice], 'C');
      new Formatter().joinVoices([npVoice]).format([npVoice], width * 0.93);
      npVoice.draw(context, stave);

      // extra intonation correctness indication for the older ones
      if (difficulty === DIFFICULTIES.HARD) {
        const svg = nowPlayingStaveNote.getSVGElement();

        svg.setAttribute(
          'style',
          `transform: translateY(${offByHzPct}px);
          fill: var(${isCorrect ? '--activeNoteColor' : '--dark'});
          stroke: var(${isCorrect ? '--activeNoteColor' : '--dark'});
          fill-opacity: .5;
          stroke-opacity:.5;
          `
        );
      }
    }
    wasCorrect = isCorrect;
  }
  function stopGame() {
    mode = MODES.CONFIGURE;
    source.disconnect(analyser);
    cancelAnimationFrame(drawNoteVisual);
    nowPlayingNote =
      nowPlayingHz =
      nowPlayingOctave =
      nowPlayingRightLastTs =
        null;
    nowPlayingRightDuration = 0;
    drawConfigNotes(availableNotes, octaves, userInstrument);
    savePoints(points);
  }

  function selectScale(evt) {
    if (scales[evt.target.value]) {
      const scale = scales[evt.target.value];
      availableNotes = scale.notes;
      selectedNotes.length = 0;
      octaves.forEach(octave => {
        selectedNotes.push(...getNotesMappedToOctave(availableNotes, octave));
      });
      drawConfigNotes(availableNotes, octaves, userInstrument);
      selectedScale = evt.target.value;
    }
  }
</script>

{#if user && user._id && user.instrument}
  {#if mode === MODES.CONFIGURE}
    <UsageHint
      message="Velg hvilke noter du vil øve på. Du kan velge en skala, klikke på noter du vil øve på, eller klikke og dra for å merke flere."
    />
  {:else if mode === MODES.PLAY}
    <UsageHint message="Spill noten du ser!" />
  {/if}

  <div class="parent">
    {#if mode === MODES.CONFIGURE}
      <select on:blur={selectScale} on:change={selectScale}>
        {#each Object.entries(scales) as [scaleName, info]}
          <option value={scaleName} selected={scaleName === selectedScale}
            >{info.name}</option
          >
        {/each}
      </select>
    {/if}
    {#if mode === MODES.PLAY}
      <div class="progress">
        <ProgressIndicator
          instrument={user.instrument}
          percentage={(nowPlayingRightDuration /
            (difficulty === DIFFICULTIES.HARD ? 3000 : 1000)) *
            100}
        />
      </div>
    {/if}
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
{:else}
  <div class="parent">
    <h1>Velkommen</h1>
    <p>Her kan du prøve <em>Treff noten</em>-spillet.</p>
    <p>
      Skriv inn epost-adresse til musikant eller foresatt for å få
      innloggingslenke til spillet på epost:
    </p>
    <SendLoginLink targetUrl="/lek/notesprint"></SendLoginLink>
  </div>
{/if}

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
  .progress {
    margin: 1em 0;
    position: absolute;
    left: calc(50% - 64px);
    z-index: 10;
    opacity: 0.2;
  }
</style>
