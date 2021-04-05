<script context="module">
  export async function preload(page) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import {
    projects,
    bands,
    selectedBand,
    assignments,
    user,
  } from '../../../lib/datastore';
  import ShareProjectForm from '../../../components/ShareProjectForm/ShareProjectForm.svelte';
  import MemberTokenLinks from '../../../components/MemberTokenLinks/MemberTokenLinks.svelte';
  import ForwardBackNav from '../../../components/ForwardBackNav/ForwardBackNav.svelte';

  let hasAssignments =
    $assignments[id] && Object.keys($assignments[id]).length > 0;
</script>

<svelte:head
  ><title>{$projects[id].name} : Send lenker - hjemmekorps.no</title
  ></svelte:head
>
{#if hasAssignments}
  <ShareProjectForm project={$projects[id]} user={$user} />

  <h2>Lenker</h2>

  <MemberTokenLinks
    project={$projects[id]}
    members={$bands[$selectedBand].members}
  />
{:else}
  <p>
    Ingen musikanter har fått stemmer enda. Gå til <a
      href={`/prosjekt/${id}/musikanter`}>tildel stemmer</a
    > først.
  </p>
{/if}


<p>
  <ForwardBackNav {id} forward={`/prosjekt/${id}/opptak`} />
</p>

<style>
  h2 {
    text-align: center;
  }
</style>
