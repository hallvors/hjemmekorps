<script>
  import Loading from '../Loading/Loading.svelte';
  import LinkedBoxList from '../LinkedBoxList/LinkedBoxList.svelte';
  import { projectList, bands } from '../../lib/datastore';
  // Dette får man fra backend
  // Beklager manglende samsvar mellom data-modellen for admin og musikant
  const band = $bands[0];
  export let user;
  let message = 'Henter låter...';
</script>

<div class="main-wrapper">
  <div class="display">
    {#if user}
      {#if $projectList && $projectList.length}
      <h1>Dine låter</h1>
        <LinkedBoxList items={$projectList.map(proj => ({
          title: proj.name,
          href: `/ta-opp/${proj._id}`,
          orderbadge: proj.recordings.length ? 'Gjort!':'',
        }))}
        />
      {:else}
        <p>Det ser ut som dirigenten ikke har gitt deg noen låter å øve på enda.</p>
      {/if}
    {:else}
      <Loading {message} subMessage="Husk å bruke høretelefoner!" />
    {/if}
  </div>
</div>

