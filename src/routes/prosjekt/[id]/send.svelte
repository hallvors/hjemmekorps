<script context="module">
  export async function preload(page) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import { projects, bands, selectedBand, user } from '../../../lib/datastore';
  import ShareProjectForm from '../../../components/ShareProjectForm/ShareProjectForm.svelte';
  import MemberTokenLinks from '../../../components/MemberTokenLinks/MemberTokenLinks.svelte';
</script>

<ShareProjectForm project={$projects[id]} user={$user} />

<h1>Lenker</h1>
<p>
  Du kan også kopiere lenker for å sende hver enkelt eller lime inn i en annen
  epost.
</p>
<p>Lenkene under går til innspillings-sider for hver enkelt musikant.</p>

<MemberTokenLinks
  project={$projects[id]}
  members={$bands[$selectedBand].members}
/>
