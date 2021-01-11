
<button on:click="{tryPlay}">spill</button>

<div id="sheetmusic-test"></div>
<script>
import { onMount } from "svelte";

let project = {
    _id: '80d2f2a9-69a3-4623-8bbe-e5c6b0842d2e'
}
let bpm = 100;
let memberName = 'Alej';

let sheetMusicRenderer;
let playing = false;

function tryPlay() {
    if (!playing) {
        sheetMusicRenderer.cursor.show();
        if (sheetMusicRenderer.sheet.HasBPMInfo) {
            bmp = sheetMusicRenderer.sheet.DefaultStartTempoInBpm;
        }
        playing = true;
        scheduleNext();
    } else {
        playing = false;
    }
}

function scheduleNext() {
    let notes = sheetMusicRenderer.cursor.NotesUnderCursor();
    console.log({notes: notes.length})
    let minValue = Number.POSITIVE_INFINITY;
    let beatNote = 1 / sheetMusicRenderer.sheet.SheetPlaybackSetting.rhythm.denominator;
    notes.forEach(note => {
        let thisValue = note.length.numerator / note.length.denominator;
        if (thisValue < minValue) {
            minValue = thisValue;
        }
    });
    console.log(minValue)
    let delayMS = (minValue / beatNote) * (60000 /* ms in minute */ / bpm);
    console.log({delayMS})
    if ( /*sheetMusicRenderer.cursor.iterator.EndReached ||*/ delayMS === Number.POSITIVE_INFINITY ||  !playing) {
        console.log('THE END');
        return;
    }
    setTimeout(nextNote, delayMS);
}

function nextNote() {
    sheetMusicRenderer.cursor.next();
    scheduleNext();
}

onMount(async() => {
        const module = await import('opensheetmusicdisplay');

        sheetMusicRenderer = new module.default.OpenSheetMusicDisplay('sheetmusic-test', {
            autoResize: true,
            drawTitle: true,
            drawingParameters: 'compact',
            drawPartNames: true,
            disableCursor: false,

        });
        fetch('/api/mxml/' + project._id)
        .then(data => data.text())
        .then(xmlSource => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(xmlSource,"text/xml");
            window.doc = (xmlDoc)

            sheetMusicRenderer.load(xmlDoc)
            .then(() => {
                sheetMusicRenderer.sheet.instruments.forEach(instrument => {
                    console.log(instrument.nameLabel.text)
                    instrument.Visible = instrument.nameLabel.text === memberName ||
                        instrument.nameLabel.text.indexOf(memberName) > -1
                });
                sheetMusicRenderer.render();
            });
        });
        //sheetMusicRenderer.load('/api/mxml/' + project._id)
        //.then(() => sheetMusicRenderer.render());    
})

</script>