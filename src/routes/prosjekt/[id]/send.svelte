<script context="module">
  export async function preload(page) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import { projects, bands, selectedBand, user } from '../../../lib/datastore';
  import ShareProjectForm from '../../../components/ShareProjectForm/ShareProjectForm.svelte';
  import MemberTokenLinks from '../../../components/MemberTokenLinks/MemberTokenLinks.svelte';
  import Back from '../../../components/Back/Back.svelte';
</script>

<svelte:head
  ><title>{$projects[id].name} : Send lenker - hjemmekorps.no</title
  ></svelte:head
>

<ShareProjectForm project={$projects[id]} user={$user} />

<h2>Lenker</h2>

<MemberTokenLinks
  project={$projects[id]}
  members={$bands[$selectedBand].members}
/>

<p>
  <ForwardBackNav {id} forward={`/prosjekt/${id}/opptak`} />
</p>

<style>
  h2 {
    text-align: center;
  }
</style>
