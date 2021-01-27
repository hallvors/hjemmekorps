<script context="module">
  let id;
  let part;
  export async function preload(page, session) {
    id = page.params.id;
    part = page.params.part;
    const res = await this.fetch(`/api/project/${id}`);
    const project = await res.json();
    return { project };
  }
</script>

<script>
  export let project;
  import NoteBox from '../../../components/NoteBox/NoteBox.svelte';
</script>

<NoteBox {project} trackName={part} showTracker={false} />
