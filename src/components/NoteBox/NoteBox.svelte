<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Loading from '../Loading/Loading.svelte'
  const dispatch = createEventDispatcher();

  // Box for displaying notes from musicXML

  export let project;
  export let trackName = null;
  export let showTracker = false;
  export let scale = 100;
  let bpm = project.bpm || 96;
  let renderingMusic = true;
  let sheetmusic;
  let sheetMusicRenderer; // OSMD instance
  let playing = false;
  let errorMessage;
  // TODO: we have one metronome elm in RecordUI and one here. The main reason
  // is to facilitate recording the "clicks" during pre-count (the idea being this
  // can make it easier to align the recorded sound files correctly) - but we should
  // refactor this.. Possibly more elegant ways to structure note rendering + recording
  // + metronome code
  let snapElm;


  export function initPlaythrough() {
    if (!playing) {
      if (showTracker) {
        sheetMusicRenderer.cursor.show();
      }
      playing = true;
      scheduleNext();
    } else {
      playing = false;
    }
  }

  function scheduleNext() {
    if (!showTracker) {
      return;
    }
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
    if (showTracker) {
      sheetMusicRenderer.cursor.next();
      snapElm.play();
    }
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
        return sheetMusicRenderer.load(xmlSource).then(() => {
          try {
            sheetMusicRenderer.render();
            renderingMusic = false;
          } catch(e) {
            renderingMusic = false;
            errorMessage = 'Lasting av noter mislyktes. Feilmelding ' + error.message;
          }
        });
      })
      .catch(e => {
        renderingMusic = false;
        errorMessage = 'Lasting av noter mislyktes. Feilmelding ' + error.message;
      });
  });
</script>
{#if renderingMusic}
<div class="loading"><Loading /></div>
{/if}
{#if errorMessage}
<div class="error">{errorMessage}</div>
{/if}
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
  .loading {
    z-index: 500;
    width: 100%;
    height: 80vh;
    background: #fff;
  }

.error {color: red}

#sheetmusic {
padding: 0
}
</style>
