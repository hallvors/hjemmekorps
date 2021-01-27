<script>
  import { stores } from '@sapper/app';
  const { session } = stores();

  import ProjectListItem from '../ProjectListItem/ProjectListItem.svelte';

  // Dette får man fra backend
  let projects = [];
  let bands = [];
  let user;

  session.subscribe(data => {
    if (data.bands) {
      bands = data.bands;
      projects = data.projects;
    }
    user = data.user;
  });
</script>

<div class="main-wrapper">
  {#if bands[0].members && bands[0].members.length}
    <div><ProjectListItem newProject={true} /></div>
    {#each projects as project}
      <div><ProjectListItem title={project.name} id={project._id} /></div>
    {/each}
  {:else}
    <p>
      Første steg er å <a href="/musikanter/import">importere musikanter</a>.
    </p>
  {/if}
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .main-wrapper > div {
    flex: 0 1 auto;
    width: 18vw;
    height: 18vw;
    margin: 1vw;
  }
</style>
