<script>
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  // Box for displaying notes from musicXML

  export let project;
  export let trackName = null;
  export let showTracker = false;
  export let scale = 100;
  let bpm = project.bpm || 60;

  let sheetmusic;
  let sheetMusicRenderer; // OSMD instance
  let playing = false;
  // TODO: we have one metronome elm in RecordUI and one here. The main reason
  // is to facilitate recording the "clicks" during pre-count (the idea being this
  // can make it easier to align the recorded sound files correctly) - but we should
  // refactor this.. Possibly more elegant ways to structure note rendering + recording 
  // + metronome code
  let snapElm; 

  function renderMusic() {}

  export function initPlaythrough() {
    if (!playing) {
      sheetMusicRenderer.cursor.show();
      playing = true;
      scheduleNext();
    } else {
      playing = false;
    }
  }

  function scheduleNext() {
    let notes = sheetMusicRenderer.cursor.NotesUnderCursor();
    //console.log({ notes: notes.length });
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
      dispatch('finished', {});
      return;
    }
    setTimeout(nextNote, delayMS);
  }

  function nextNote() {
    sheetMusicRenderer.cursor.next();
    snapElm.play();
    scheduleNext();
  }

  export function stopPlaythrough() {
    playing = false;
  }

  onMount(async () => {
    const module = await import('opensheetmusicdisplay');

    sheetMusicRenderer = new module.default.OpenSheetMusicDisplay(
      sheetmusic,
      {
        autoResize: true,
        drawTitle: true,
        drawingParameters: 'compact',
        drawtrackNames: true,
        disableCursor: !showTracker,
        followCursor: true,
      }
    );
    sheetMusicRenderer.zoom = scale / 100;
    fetch(
      `/api/project/${project._id}/score/${
        trackName ? encodeURIComponent(trackName) : ''
      }`
    )
      .then(data => data.text())
      .then(xmlSource => {
        sheetMusicRenderer.load(xmlSource).then(() => {
          sheetMusicRenderer.render();
        });
      });
  });
</script>

<div class="standard-box note-box" bind:this={sheetmusic} id="sheetmusic" />
<!-- svelte-ignore a11y-media-has-caption -->
<audio bind:this={snapElm} src="/samples/snap.mp3" preload />

<style>
  .note-box {
    margin-top: 30px;
    padding: 5%;
    height: 100%;
    overflow: auto;
  }
  /*
    .note-box h2 {
        padding: 0;
        margin: 0;
    }
    */
</style>
