<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import { projects, bands, selectedBand } from '../../../lib/datastore';
  import MemberTokenLinks from '../../../components/MemberTokenLinks/MemberTokenLinks.svelte';
</script>

<h1>Lenker</h1>
<p>Lenkene under går til innspillings-sider for hver enkelt musikant.</p>
<p>
  Det er for eksempel mulig å kopiere alle navnene herfra til en epost, og
  skrive at hver skal klikke på sitt eget navn for å gjøre opptak.
</p>

<MemberTokenLinks
  project={$projects[id]}
  members={$bands[$selectedBand].members}
/>
