<script context="module">
  export async function preload(page, session) {
    const res = await this.fetch(`/api/project/${page.params.id}`);
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
    project = { ...evt.detail };
  }
</script>

<ProjectMain {project} {band} on:dataupdate={onUpdate} />
