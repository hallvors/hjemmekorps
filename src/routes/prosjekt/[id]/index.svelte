<script context="module">
  let id;
  export async function preload(page, session) {
    id = page.params.id;
    const res = await this.fetch(`/api/project/${id}`);
    const project = await res.json();
    const band = session.bands[0];
    return { project, band };
  }
</script>

<script>
  export let project;
  export let band;

  import ProjectMain from '../../../components/ProjectMain/ProjectMain.svelte';

  function onUpdate(evt) {
    project = evt.detail;
  }
</script>

<ProjectMain {project} {band} on:dataupdate={onUpdate} />
