<script>
  import NoteSprintGame from '../../../components/NoteSprintGame/NoteSprintGame.svelte';
  import { user, bands } from '../../../lib/datastore';
  const band = $bands[0];
</script>

<div>
  <NoteSprintGame {band} user={$user} />
</div>

<style type="text/css">
</style>
