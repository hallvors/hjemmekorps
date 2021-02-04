<script>
  import RecordUI from '../RecordUI/RecordUI.svelte';
  import Loading from '../Loading/Loading.svelte';
  import {projectList} from '../../lib/datastore'
  // Dette får man fra backend
  // Beklager manglende samsvar mellom data-modellen for admin og musikant
  const project = $projectList[0];
  export let user;
</script>

<div class="main-wrapper">
  <div class="display">
    {#if project && user}
    <RecordUI {project} {user} />
    {:else}
       <Loading />
    {/if}
  </div>
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
  }

</style>
