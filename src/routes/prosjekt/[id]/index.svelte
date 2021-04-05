<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import { projects } from '../../../lib/datastore';

  import LinkedBoxList from '../../../components/LinkedBoxList/LinkedBoxList.svelte';

  let project = $projects[id];

  let subpages = [
    {
      href: `/prosjekt/${id}/musikanter`,
      title: 'Tildel stemmer',
      orderbadge: 1,
    },
    { href: `/prosjekt/${id}/send`, title: 'Send noter', orderbadge: 2 },
    { href: `/prosjekt/${id}/opptak`, title: 'Hør opptak', orderbadge: 3 },
  ];
</script>

<svelte:head><title>{project.name} - hjemmekorps.no</title></svelte:head>

<LinkedBoxList items={subpages} />

<p>
  Du kan også <a href={`/prosjekt/${id}/stemmer`}
    >sjekke om notene er lastet opp korrekt</a
  >.
</p>

<style>
  p {
    text-align: center;
  }
</style>
