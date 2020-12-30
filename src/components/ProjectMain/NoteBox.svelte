<script>
    // Box for displaying notes from musicXML

    export let project;

    // OpenSheetMusicDisplay uses browser APIs and must therefore be imported
    // in the onMount method, which does not run during server-side rendering
    import { onMount } from 'svelte';

    onMount(async () => {
        const module = await import('opensheetmusicdisplay');
        let sheetMusicRenderer = new module.default.OpenSheetMusicDisplay('sheetmusic', {
            autoResize: true,
            drawTitle: true,
        });
        sheetMusicRenderer.load('/api/mxml/' + project._id)
        .then(() => sheetMusicRenderer.render());
    });
</script>


<div class="standard-box note-box" id="sheetmusic">
</div>

<style>
    .note-box {
        margin-top: 30px;
        padding: 5%;
        height: 20vw;
    }

    .note-box h2 {
        padding: 0;
        margin: 0;
    }
</style>