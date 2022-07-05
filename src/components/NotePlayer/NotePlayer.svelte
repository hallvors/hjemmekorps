<script>
  // Box for displaying notes from musicXML
  import { createEventDispatcher, onMount } from 'svelte';
  import Loading from '../Loading/Loading.svelte';
  import { logPerfStats } from '../utils/logging';

  const dispatch = createEventDispatcher();

  export let project;
  export let trackName = null;
  export let audioContext;

  let sheetMusicRenderer; // OSMD instance
  let sheetmusicElm;
  let renderingMusic = true;
  let loadingMessage = 'Henter notene...';
  let startTime;
  const timeStart = Date.now();
  let playbackManager;
  let timingSource;
  let audioPlayer;
  onMount(async function () {
    loadingMessage = 'Henter notene...';
    let request;
    let perfmeasure = Date.now();
    let markup;
    const url = `/api/project/${project._id}/score/${
      trackName ? encodeURIComponent(trackName) : ''
    }`;
    if (sessionStorage.getItem(url)) {
      markup = sessionStorage.getItem(url);
      logPerfStats({
        measurement: 'fetch-music-partfile',
        project: project._id,
        ms: Date.now() - perfmeasure,
        wasCached: true,
      });
    }
    loadingMessage = 'Tilpasser notene til din skjerm...';
    let zoom = 1;
    if (window.innerWidth <= 480) {
      zoom = 0.75;
    }
    if (markup || url) {
      perfmeasure = Date.now();
      // opensheetmusicdisplay is global variable, from SCRIPT element in template
      sheetMusicRenderer = new opensheetmusicdisplay.OpenSheetMusicDisplay(
        sheetmusicElm,
        {
          //            autoResize: false, // important! OSMD must not redraw notes with new IDs
          backend: 'svg',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawPartNames: false,
          drawMetronomeMarks: true,
          disableCursor: false,
          followCursor: true,
          drawingParameters: 'compact',
          cursorsOptions: [
            {
              type: opensheetmusicdisplay.CursorType.Standard,
              color: '#000099',
              alpha: 0.4,
              follow: true,
            },
          ],
          OnXMLRead: function (xml) {
            if (!(url in sessionStorage)) {
              sessionStorage.setItem(url, xml);
            }
            return xml;
          },
        }
      );
      await sheetMusicRenderer.load(markup || url);
      sheetMusicRenderer.zoom = zoom; // must be after load() for some reason
      sheetMusicRenderer.EngravingRules.RenderRehearsalMarks = false; // Workaround because Flute voices get marks intended for the full score
      sheetMusicRenderer.render();
      console.log('render done');
      logPerfStats({
        measurement: 'render-music-osmde',
        project: project._id,
        ms: Date.now() - perfmeasure,
      });
      audioPlayer = new opensheetmusicdisplay.BasicAudioPlayer();
      timingSource = new opensheetmusicdisplay.LinearTimingSource();
      playbackManager = new opensheetmusicdisplay.PlaybackManager(
        timingSource,
        undefined,
        audioPlayer,
        undefined
      );
      playbackManager.Metronome.Volume = 0.5;
      playbackManager.DoPlayback = true;
      playbackManager.DoPreCount = true;
      playbackManager.PreCountMeasures = 1; // note that DoPreCount has to be true for a precount to happen
      timingSource.Settings = sheetMusicRenderer.sheet.playbackSettings;
      playbackManager.initialize(sheetMusicRenderer.sheet.musicPartManager);
      playbackManager.addListener(sheetMusicRenderer.cursor);
      playbackManager.addListener({
        cursorPositionChanged: (timestamp, data) => {
          console.log('cursorpositionchanged', { timestamp, data });
          dispatch('measuretime', {
            time: audioContext.currentTime - startTime,
          });
        },
        pauseOccurred: obj => {
          console.log('paused', obj);
          dispatch('ended');
        },
        selectionEndReached: obj => {
          console.log('ended', obj);
          dispatch('ended');
        },
        resetOccurred: obj => {
          console.log('reset');
        },
        notesPlaybackEventOccurred: obj => {
          console.log('playback event', obj);
          dispatch('countdownUiUpdate');
        },
      });
      sheetMusicRenderer.renderingManager.addListener({
        userDisplayInteraction: (
          relativePosition,
          positionInSheetUnits,
          type
        ) => {
          console.log('user interaction', {
            relativePosition,
            positionInSheetUnits,
            type,
          });
          switch (type) {
            case 0:
            case 1:
            case 2: {
              const clickVe =
                sheetMusicRenderer.renderingManager.GraphicalMusicSheet.GetNearestVoiceEntry(
                  positionInSheetUnits
                );

              // set cursor and/or start/end marker position
              if (clickVe) {
                if (
                  clickVe.parentStaffEntry.parentVerticalContainer !== undefined
                ) {
                  const clickedTimeStamp =
                    clickVe.parentStaffEntry.parentVerticalContainer
                      .AbsoluteTimestamp;
                  sheetMusicRenderer.renderingManager.setStartPosition(
                    clickedTimeStamp
                  );
                  playbackManager.setPlaybackStart(clickedTimeStamp);
                }
              }
              break;
            }
            default:
              // Do nothing
              break;
          }
        },
      });
      //debugger;
      top.osmd = sheetMusicRenderer; // Debug. TODO: remove
    }
    renderingMusic = false;
    let hasElm = Boolean(document.getElementsByTagName('svg')[0]);
    console.log('render time: ' + (Date.now() - timeStart) + 'ms', hasElm);
  });

  export function initPlaythrough() {
    document.documentElement.scrollTop = 0;
    startTime = audioContext.currentTime;
    playbackManager.setPlaybackStart();
    timingSource.reset();
    playbackManager.play();
  }
  export function stopPlaythrough() {
    playbackManager.stop();
  }
</script>

{#if renderingMusic}
  <div class="loading">
    <Loading
      message={loadingMessage}
      subMessage="Husk å bruke høretelefoner!"
    />
  </div>
{/if}
<div class="note-box" bind:this={sheetmusicElm} id="sheetmusic" />

<style>
  :global(svg) {
    max-width: 100%;
  }
  .note-box {
    /*
        Whoever embeds a NotePlayer should style margins
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
