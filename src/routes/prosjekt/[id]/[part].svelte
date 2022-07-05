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
  import NotePlayer from '../../../components/NotePlayer/NotePlayer.svelte';
  import UsageHint from '../../../components/UsageHint/UsageHint.svelte';
  import Back from '../../../components/Back/Back.svelte';
</script>

<svelte:head><title>{$projects[id].name} : {part} - hjemmekorps.no</title></svelte:head>

<h1>{part}</h1>
<UsageHint message="Her kan du sjekke at notene er lastet opp riktig." textAlign="left" />

<NotePlayer project={$projects[id]} trackName={part} />

<p>
  <Back href={`/prosjekt/${id}/stemmer`} />
</p>
