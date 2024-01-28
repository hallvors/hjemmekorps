<script>
  import { onMount } from 'svelte';
  import { bands, selectedBand } from '../lib/datastore';

  import PointsRendererAdmin from '../components/PointsRenderer/PointsRendererAdmin.svelte';
    import Back from '../components/Back/Back.svelte';
  let hitNoteStats;
  onMount(async () => {
    hitNoteStats = await (
      await fetch(`/api/games/hit-note?band=${$bands[$selectedBand]._id}`, {
        credentials: 'same-origin',
      })
    ).json();
  });
</script>

{#if hitNoteStats}
  <PointsRendererAdmin points={hitNoteStats} />
{/if}

<Back href="/"/>