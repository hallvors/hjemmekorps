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
    { href: `/prosjekt/${id}/musikanter`, title: 'Musikanter' },
    { href: `/prosjekt/${id}/send`, title: 'Send noter' },
    { href: `/prosjekt/${id}/stemmer`, title: 'Stemmer' },
    { href: `/prosjekt/${id}/opptak`, title: 'Opptak' },
  ];
</script>

<svelte:head><title>{project.name} - hjemmekorps.no</title></svelte:head>


  <LinkedBoxList items={subpages} />
