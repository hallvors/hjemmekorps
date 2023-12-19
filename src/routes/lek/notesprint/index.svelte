<script context="module">
  export async function preload(page) {
    const queryNotes = page.query.noter;
    return { queryNotes: (queryNotes || '').split(/,\s?/g).filter(Boolean) };
  }
</script>

<script>
  export let queryNotes;
  import NoteSprintGame from '../../../components/NoteSprintGame/NoteSprintGame.svelte';
  import { user, bands } from '../../../lib/datastore';
  const band = $bands[0];
</script>

<div>
  <NoteSprintGame user={$user} {queryNotes} />
</div>
