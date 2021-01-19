<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  import LibLoader from "../utils/LibLoader.svelte";

  // Box for displaying notes from musicXML

  export let project;
  export let trackForPerson = null;
  export let showTracker = false;
  let sheetmusic;
  let alphaTabInstance;
  let scrollControlInterval;

  function renderMusic() {
    alphaTabInstance = new alphaTab.AlphaTabApi(sheetmusic, {
      file: project.sheetmusicFile,
      player: {
        enablePlayer: showTracker,
        soundFont: "/js/alphatab/soundfont/sonivox.sf2",
        // this is the element to scroll during playback - disabled because it is buggy and scrolls too much!
        //scrollElement: sheetmusic, 
      },
      notation: {
        elements: {
          GuitarTuning: false,
          EffectTempo: false,
        },
      },
    });

    alphaTabInstance.load(project.sheetmusicFile);
    alphaTabInstance.countInVolume = 1;
    alphaTabInstance.metronomeVolume = 1;
    alphaTabInstance.masterVolume = 0.0;
    alphaTabInstance.scoreLoaded.on((score) => {
      if (trackForPerson) {
        // generate a track item for all tracks of the score
        score.tracks.forEach((track) => {
          if (track.name && track.name.indexOf(trackForPerson) > -1) {
            // TODO: where is player info in trackdata ???
            alphaTabInstance.renderTracks([track]);
          }
          //trackList.appendChild(createTrackItem(track));
        });
      } else {
        alphaTabInstance.render();
      }
    });

    // mark the rendered track as active in the list
    alphaTabInstance.renderStarted.on(() => {
      // collect tracks being rendered
      const tracks = new Map();
      // here we access the currently rendered tracks of alphaTab
      alphaTabInstance.tracks.forEach((t) => {
        tracks.set(t.index, t);
      });
    });
    alphaTabInstance.playerFinished.on(() => {
      dispatch("finished", {});
    });
  }

  export function initPlaythrough() {
    alphaTabInstance.changeTrackSolo();
    alphaTabInstance.play();
    scrollControlInterval = setInterval(function () {
      document.getElementsByClassName("at-cursor-beat")[0].scrollIntoView();
    }, 200);
  }

  export function pausePlaythrough() {
    clearInterval(scrollControlInterval);
    alphaTabInstance.pause();
  }

  export function stopPlaythrough() {
    clearInterval(scrollControlInterval);
    alphaTabInstance.stop();
  }

  /* Old OSMD - code for rendering score:
        const module = await import('opensheetmusicdisplay');

        sheetMusicRenderer = new module.default.OpenSheetMusicDisplay('sheetmusic', {
            autoResize: true,
            drawTitle: true,
        });
        sheetMusicRenderer.load('/api/mxml/' + project._id)
        .then(() => sheetMusicRenderer.render());

*/
</script>

<LibLoader
  src="/js/alphatab/alphaTab.min.js"
  on:loaded={renderMusic}
  libraryDetectionObject="alphaTab"
/>

<div class="standard-box note-box" bind:this={sheetmusic} id="sheetmusic" />

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
