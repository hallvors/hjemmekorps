<script>
  import { stores } from '@sapper/app';
  const { session } = stores();

  import ProjectDisplay from '../ProjectDisplay/ProjectDisplay.svelte'

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
  <div class="display">
    <ProjectDisplay newProject={true} />
    {#each projects as project}
      <ProjectDisplay title={project.name} id={project._id} />
    {/each}
  </div>
  <p>
    Første steg er å <a href="/musikanter/import">importer musikanter</a>.
  </p>
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
  }

  .display {
    display: grid;
    grid-gap: 40px;
    grid-template-columns: 1fr 1fr 1fr;

    justify-items: center;
  }

  /* || Media queries */

  @media only screen and (min-width: 1200px) {
    .main-wrapper {
      width: 1200px;
    }
  }

  @media only screen and (max-width: 820px) {
    .display {
      grid-template-columns: 1fr 1fr;
  }
    }
  @media only screen and (max-width: 600px) {
    .display {
      grid-template-columns: 1fr;
  }
    }
</style>