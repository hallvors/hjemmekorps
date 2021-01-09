<script>
    import LibLoader from "../utils/LibLoader.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    // Box for displaying notes from musicXML
    // optionally has a "play" button to show
    // countdown and highlight notes in right
    // tempo

    export let project;
    export let showPlayButton = false;
    export let trackForPerson = null;

    let sheetmusic;
    let alphaTabInstance;
    function renderMusic() {
        console.log({project}); console.log({trackForPerson})
        alphaTabInstance = new alphaTab.AlphaTabApi(sheetmusic, {
            file: project.sheetmusicFile,
            player: {
                enablePlayer: true,
                soundFont: "/js/alphatab/soundfont/sonivox.sf2",
                scrollElement: sheetmusic, // this is the element to scroll during playback
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
                    console.log(track);
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
                console.log(t);
                tracks.set(t.index, t);
            });
            /*
	// mark the item as active or not
	const trackItems = trackList.querySelectorAll(".at-track");
	trackItems.forEach((trackItem) => {
		if (tracks.has(trackItem.track.index)) {
			trackItem.classList.add("active");
		} else {
			trackItem.classList.remove("active");
		}
    });
    */
        });
    }

function initPlaythrough() {
    alphaTabInstance.changeTrackSolo(); 
    alphaTabInstance.play(); 
    dispatch('play')
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

<style>
    .note-box {
        margin-top: 30px;
        padding: 5%;
        height: 20vw;
        overflow: auto;
    }

    .note-box h2 {
        padding: 0;
        margin: 0;
    }
    /* TODO: alphaTab-styles do not work yet because Svelte removes stuff that seems unused */
    .at-cursor-bar {
        /* Defines the color of the bar background when a bar is played */
        background: rgba(255, 242, 0, 0.25);
    }

    .at-selection div {
        /* Defines the color of the selection background */
        background: rgba(64, 64, 255, 0.1);
    }

    .at-cursor-beat {
        /* Defines the beat cursor */
        background: rgba(64, 64, 255, 0.75);
        width: 3px;
    }

    .at-highlight * {
        /* Defines the color of the music symbols when they are being played (svg) */
        fill: #0078ff;
        stroke: #0078ff;
    }
</style>

<LibLoader
    src="/js/alphatab/alphaTab.min.js"
    on:loaded={renderMusic}
    libraryDetectionObject="alphaTab" />

<div class="standard-box note-box" bind:this={sheetmusic} id="sheetmusic" />

{#if showPlayButton}
    <button
        type="button"
        on:click="{initPlaythrough}"
    >Start</button>
{/if}
