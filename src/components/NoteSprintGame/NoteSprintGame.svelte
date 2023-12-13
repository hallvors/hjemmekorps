<script>
  // TODO:
  // real support for F-nøkkel
  // Show band streak, band points in page
  // fortegn!
  // longer durations for older members?

  import { onMount } from 'svelte';
  export let band;
  export let user;
  console.log({ band, user });
  import { Vex, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
  import UsageHint from '../UsageHint/UsageHint.svelte';
  import Star from '../Star/Star.svelte';
  import PointsRenderer from '../PointsRenderer/PointsRenderer.svelte';
  import Button from '../Button/Button.svelte';
  import { getRandomInt } from '../../lib/utils';
  import { autoCorrelate } from '../../lib/pitch';
  let sheetmusicElm;
  const BASS_INSTRUMENTS = ['trombone', 'baritone', 'bass'];
  const availableNotes = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
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

  function drawConfigNotes(noteNames, octaves) {
    if (context) {
      context.clear();
    }
    stave = new Stave(110 /* x */, 60 /* y */, width /* width */);
    stave.addClef(
      BASS_INSTRUMENTS.includes(user.instrument) ? 'bass' : 'treble'
    );
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
    width = sheetmusicElm.offsetWidth * 0.9;
    const { Renderer, Stave } = Vex.Flow;
    renderer = new Renderer(sheetmusicElm, Renderer.Backends.SVG);
    renderer.resize(width, 200);
    context = renderer.getContext();
    octaves = BASS_INSTRUMENTS.includes(user.instrument) ? [3, 4] : [4, 5];
    drawConfigNotes(availableNotes, octaves);
    document.addEventListener(
      'click',
      evt => {
        if (mode !== MODES.CONFIGURE) {
          return;
        }
        let elm = evt.target;
        while (elm && elm.dataset && !elm.dataset.notevalue) {
          elm = elm.parentElement;
        }
        if (elm && elm.dataset && elm.dataset.notevalue) {
          selectedNotes.push(elm.dataset.notevalue);
        }
        drawConfigNotes(availableNotes, octaves);
      },
      true
    );

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
    //      var roundingValue = document.querySelector('input[name="rounding"]:checked').value
    //      if (roundingValue == 'none') {
    // Do nothing
    //      } else if (roundingValue == 'hz') {
    valueToDisplay = Math.round(valueToDisplay);
    //      } else {
    // Get the closest note
    // Thanks to PitchDetect:
    //        valueToDisplay = noteStrings[noteFromPitch(autoCorrelateValue) % 12];
    //      }

    //      var smoothingValue = document.querySelector('input[name="smoothing"]:checked').value
    console.log(autoCorrelateValue);
    if (autoCorrelateValue === -1) {
      //        document.getElementById('note').innerText = 'Too quiet...';
      nowPlayingNote = null;
      drawTask();
      return;
    }
    nowPlayingNote =
      noteStrings[noteFromPitch(autoCorrelateValue) % 12].toLowerCase();
    // we also need octave info
    // TODO: this will ALL be different for bass clef, right?

    if (autoCorrelateValue > 130 && autoCorrelateValue < 261) {
      nowPlayingOctave = 3;
    } else if (autoCorrelateValue >= 261 && autoCorrelateValue < 523) {
      nowPlayingOctave = 4;
    } else if (autoCorrelateValue > 523 && autoCorrelateValue < 1046) {
      nowPlayingOctave = 5;
    }
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
    const num = getRandomInt(0, selectedNotes.length - 1);
    hits.length = 0;
    currentTaskNote = selectedNotes[num];
    console.log(currentTaskNote);
  }
  function drawTask() {
    const npNoteValue = nowPlayingNote
      ? `${nowPlayingNote}/${nowPlayingOctave}`
      : null;
    const isCorrect = npNoteValue === currentTaskNote;
    console.log({ isCorrect, npNoteValue });
    context.clear();
    stave = new Stave(110 /* x */, 60 /* y */, width /* width */);
    stave.addClef(
      BASS_INSTRUMENTS.includes(user.instrument) ? 'bass' : 'treble'
    );
    stave.setContext(context).draw();
    const voice = new Voice({
      num_beats: 1,
      beat_value: 4,
    });
    const taskNote = new StaveNote({
      keys: [currentTaskNote],
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
    drawConfigNotes(availableNotes, octaves);
    savePoints(points);
  }
</script>

{#if mode === MODES.CONFIGURE}
  <UsageHint message="Klikk alle noter du vil øve på." />
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
    furtherStats={serverData}
    extraPointsSinceLoad={points - serverData.userPointsToday}
  />
{/if}

<style type="text/css">
  .toolbar {
    text-align: center;
  }
  .parent {
    position: relative;
  }
  .star {
    position: absolute;
    left: 49%;
    top: 55%;
  }
</style>
