<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let project = {
    _id: 'w3J2fgMuhjI3JWEP60jjkT',
  };
  let bpm = 100;
  let trackName = 'Flute';

  let sheetMusicRenderer;
  let playing = false;

  function tryPlay() {
    if (!playing) {
      sheetMusicRenderer.cursor.show();
      if (sheetMusicRenderer.sheet.HasBPMInfo) {
        bpm = sheetMusicRenderer.sheet.DefaultStartTempoInBpm;
      }
      playing = true;
      scheduleNext();
    } else {
      playing = false;
    }
  }

  let repetitions = [];

  function scheduleNext() {
    let notes = sheetMusicRenderer.cursor.NotesUnderCursor();
    console.log({ notes: notes.length });
    let minValue = Number.POSITIVE_INFINITY;
    let beatNote =
      1 / sheetMusicRenderer.sheet.SheetPlaybackSetting.rhythm.denominator;
    notes.forEach(note => {
      let thisValue = note.length.numerator / note.length.denominator;
      if (thisValue < minValue) {
        minValue = thisValue;
      }
    });
    //console.log(minValue);
    let delayMS = (minValue / beatNote) * (60000 /* ms in minute */ / bpm);
    //console.log({ delayMS });
    if (
      /*sheetMusicRenderer.cursor.iterator.EndReached ||*/ delayMS ===
        Number.POSITIVE_INFINITY ||
      !playing
    ) {
      console.log('THE END');
      dispatch("finished", {});
      return;
    }

    // Repetition?
    if (
      sheetMusicRenderer.cursor.Iterator.currentMeasure
        .firstRepetitionInstructions
    ) {
      console.log(
        sheetMusicRenderer.cursor.Iterator.currentMeasure
          .firstRepetitionInstructions
      );
      repetitions.push({
        start:
          sheetMusicRenderer.cursor.Iterator.currentMeasure
            .firstRepetitionInstructions,
        end: null,
        count: 0,
      });
    }

    setTimeout(nextNote, delayMS);
  }

  function nextNote() {
    sheetMusicRenderer.cursor.next();
    scheduleNext();
  }

  onMount(async () => {
    const module = await import('opensheetmusicdisplay');

    sheetMusicRenderer = new module.default.OpenSheetMusicDisplay(
      'sheetmusic-test',
      {
        autoResize: true,
        drawTitle: true,
        drawingParameters: 'compact',
        drawtrackNames: true,
        disableCursor: false,
        followCursor: true,
      }
    );
    fetch(`/api/project/${project._id}/score/${encodeURIComponent(trackName)}`)
      .then(data => data.text())
      .then(xmlSource => {
        sheetMusicRenderer.load(xmlSource).then(() => {
          sheetMusicRenderer.render();
        });
      });
  });
</script>

<button on:click={tryPlay}>spill</button>

<div id="sheetmusic-test" />
