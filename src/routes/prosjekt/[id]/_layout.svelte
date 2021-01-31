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

    return {
      id,
      preloadProject,
      host: page.host,
      protocol: session.protocol,
      user: session.user,
    };
  }
</script>

<script>
  import fetch from 'cross-fetch';
  import Loading from '../../../components/Loading/Loading.svelte';
  import { projects, addProject } from '../../../lib/datastore';

  export let id;
  export let host;
  export let protocol;
  export let user;
  export let preloadProject;

  if (preloadProject) {
    addProject(preloadProject);
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
  <div class="wait"><Loading /></div>
{:then project}
  <slot />
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

<style>
  .wait {
    height: 100vh;
  }
</style>
