<script>
  // Hjemskjermen for et prosjekt
  export let project;
  import NoteBox from "./NoteBox.svelte";
</script>

{#if project.generated_soundfile}
  <main class="merged-audio">
    <h1 style="text-align: center;">Samlet lydfil</h1>
    <span class="audio">
      <!-- svelte-ignore a11y-media-has-caption -->
      <!-- We can not create captions for user-generated music files :) -->
      <audio controls src={project.generated_soundfile}>
        Audio does not work
      </audio>
    </span>
  </main>
{/if}

<NoteBox {project} scale={50} />

<style>
  .merged-audio {
    text-align: center;

    margin-top: 30px;
    padding-bottom: 30px;
    border: var(--border);
    box-shadow: var(--shadow);
  }
</style>
