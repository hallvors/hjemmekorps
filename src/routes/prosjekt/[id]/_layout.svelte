<script context="module">
  // This _layout file has nothing to do with layout,
  // it just ensures the other routes here will
  // have the relevant project in the data store
  // and will not need to duplicate this code to load
  // project data if it is not loaded yet.

  export async function preload(page, session) {
    let id = page.params.id;
    const res = await this.fetch(`/api/project/${id}`);
    const preloadProject = await res.json();
    const res2 = await this.fetch(`/api/bands`);
    const preloadBands = await res2.json();

    return {
      id,
      preloadProject,
      preloadBands,
      host: page.host,
      protocol: session.protocol,
      user: session.user,
    };
  }
</script>

<script>
  import fetch from 'cross-fetch';
  import Loading from '../../../components/Loading/Loading.svelte';
  import { projects, addProject, updateBands } from '../../../lib/datastore';

  export let id;
  export let host;
  export let protocol;
  export let user;
  export let preloadProject;
  export let preloadBands;

  if (preloadProject) {
    addProject(preloadProject);
  }

  if (preloadBands) {
    updateBands(preloadBands);
  }

  let projectPromise = $projects[id]
    ? Promise.resolve($projects[id])
    : fetch(`${protocol}://${host}/api/project/${id}`, {
        headers: {
          Cookie: `token=${user.token}`,
        },
        credentials: 'same-origin',
      })
        .then(fetched => fetched.json())
        .then(project => {
          addProject(project);
          return project;
        });
</script>

{#await projectPromise}
  <Loading />
{:then project}
<main>
  <header class="project-info">
      <h1 class="h1-bigger project-title">{project.name}</h1>
      <p>Lagt til {project._createdAt} av <em>{project.owner}</em></p>
  </header>

<slot />
</main>

{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

<style>
  .project-title {
    text-align: center;
    padding-top: 0.8em;
    margin: 0;
  }

  h1 {
    text-transform: uppercase;
  }
  header {
    text-align: center;
    border-bottom: 1px dashed grey;
    margin-bottom: 0.8em;
  }

</style>
