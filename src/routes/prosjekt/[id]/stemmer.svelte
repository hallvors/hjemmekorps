<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import { bands, selectedBand, projects } from '../../../lib/datastore';

  import ProjectPartsLinks from '../../../components/ProjectPartsLinks/ProjectPartsLinks.svelte';
  import UsageHint from '../../../components/UsageHint/UsageHint.svelte';
  import Back from '../../../components/Back/Back.svelte';

  let project = $projects[id];
</script>

<svelte:head><title>{project.name} - hjemmekorps.no</title></svelte:head>
<h2>Stemmer</h2>
<UsageHint
  message="Her kan du sjekke at de ulike stemmene for låta har blitt lagt inn korrekt."
/>
<ProjectPartsLinks {project} band={$bands[$selectedBand]} />

<p>
  <Back {id} />
</p>

<style>
  h2 {
    text-align: center;
  }
</style>
