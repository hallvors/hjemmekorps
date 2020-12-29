<script context="module">
	let id;
    export async function preload(page, session) {
        id = page.params.id;
        const res = await this.fetch(`/api/project/${id}`);
        const project = await res.json();
        console.log('did load project data', project)
        return { project };
    }
</script>
<script>
export let project;

import ProjectMain from '../../components/ProjectMain/ProjectMain.svelte'
</script>


<ProjectMain project={project} />
