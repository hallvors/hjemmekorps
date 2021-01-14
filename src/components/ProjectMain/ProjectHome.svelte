<script>
    // Hjemskjermen for et prosjekt
    export let project;
    import NoteBox from "./NoteBox.svelte"
</script>
<main class="merged-audio">

        <h1 style="text-align: center;">Samlet lydfil</h1>
        <span class="audio">
            <audio controls src="../samples/sample.mp3">
                <track kind="captions"/>
                Audio does not work
            </audio>
        </span>

</main>
<NoteBox project={project} />


<style>
    .merged-audio {
        text-align: center;

        margin-top: 30px;
        padding-bottom: 30px;
        border: var(--border);
        box-shadow: var(--shadow);
    }
</style>