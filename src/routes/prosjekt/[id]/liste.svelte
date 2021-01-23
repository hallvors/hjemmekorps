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

import MemberTokenLinks from '../../../components/MemberTokenLinks/MemberTokenLinks.svelte'
</script>

<h1>Lenker</h1>
<p>
Lenkene under går til innspillings-sider for hver enkelt musikant.
</p>
<p>Det er for eksempel mulig å kopiere alle navnene herfra til en epost, og skrive at hver skal klikke på sitt eget navn for å gjøre opptak.</p>

<MemberTokenLinks project={project} />
