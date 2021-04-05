<script>
  // Liste over stemmer
  export let project;
  import LinkedBoxList from '../LinkedBoxList/LinkedBoxList.svelte';
  let partslinks = project.partslist
    ? project.partslist.map(item => ({
        href: `/prosjekt/${project._id}/${item.part}`,
        title: item.part,
      }))
    : [];
</script>

<div class="partslist">
    <LinkedBoxList items={partslinks} />
</div>
