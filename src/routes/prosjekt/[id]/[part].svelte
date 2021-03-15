<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    let part = page.params.part;
    return { id, part };
  }
</script>

<script>
  export let id;
  export let part;
  import { projects } from '../../../lib/datastore';
  import NoteBox from '../../../components/NoteBox/NoteBox.svelte';
  import UsageHint from '../../../components/UsageHint/UsageHint.svelte';
</script>

<svelte:head><title>{$projects[id].name} : {part} - hjemmekorps.no</title></svelte:head>

<h1>{part}</h1>
<UsageHint message="Her kan du sjekke at notene er lastet opp riktig." textAlign="left" />

<NoteBox project={$projects[id]} trackName={part} />

<p><a href="/prosjekt/{id}" on:click={() => history.back()}>Tilbake</a></p>
