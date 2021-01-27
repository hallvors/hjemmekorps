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

{#if bands[0].members && bands[0].members.length}
  <div class="main-wrapper">
    <div><ProjectListItem newProject={true} /></div>
    {#each projects as project}
      <div><ProjectListItem title={project.name} id={project._id} /></div>
    {/each}
  </div>
{:else}
    <h1>Velkommen, {user.friendly_name}!</h1>
    <p>
      Første steg er å <a href="/musikanter/import">importere musikanter</a>.
    </p>
{/if}

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
