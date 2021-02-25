<script>
  // Hjemskjermen for et prosjekt
  export let project;
  import LinkedBoxList from '../LinkedBoxList/LinkedBoxList.svelte';
  let partslinks = project.partslist
    ? project.partslist.map(item => ({
        href: `/prosjekt/${project._id}/${item.part}`,
        title: item.part,
      }))
    : [];
</script>

{#if project.generated_soundfile}
  <div class="merged-audio">
    <h1 style="text-align: center;">Samlet lydfil</h1>
    <span class="audio">
      <!-- svelte-ignore a11y-media-has-caption -->
      <!-- We can not create captions for user-generated music files :) -->
      <audio controls src={project.generated_soundfile.url}>
        Audio does not work
      </audio>
    </span>
  </div>
{/if}

<div class="partslist">
    <LinkedBoxList items={partslinks} />
</div>

<style>
  .merged-audio {
    text-align: center;
    margin-top: 30px;
    padding-bottom: 30px;
    border: var(--border);
    box-shadow: var(--shadow);
  }
  audio {
    width: 100%;
  }
</style>
