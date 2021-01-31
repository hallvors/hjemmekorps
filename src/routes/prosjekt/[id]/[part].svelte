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
</script>

<NoteBox project={$projects[id]} trackName={part} showTracker={false} />
