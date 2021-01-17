<script>
  // Hjemskjermen for et prosjekt
  export let project;
  import NoteBox from "./NoteBox.svelte";
</script>

{#if project.generated_soundfile}
  <main class="merged-audio">
    <h1 style="text-align: center;">Samlet lydfil</h1>
    <span class="audio">
      <audio controls src={project.generated_soundfile}>
        Audio does not work
      </audio>
    </span>
  </main>
{/if}
<NoteBox {project} />

<style>
  .merged-audio {
    text-align: center;

    margin-top: 30px;
    padding-bottom: 30px;
    border: var(--border);
    box-shadow: var(--shadow);
  }
</style>
