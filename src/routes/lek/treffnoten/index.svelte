<script context="module">
  export async function preload(page) {
    const queryNotes = page.query.noter;
    return { queryNotes: (queryNotes || '').split(/,\s?/g).filter(Boolean) };
  }
</script>

<script>
  export let queryNotes;
  import HitNoteGame from '../../../components/HitNoteGame/HitNoteGame.svelte';
  import { user, bands } from '../../../lib/datastore';
  const band = $bands[0];
</script>

<div>
  <HitNoteGame user={$user} {queryNotes} />
</div>
