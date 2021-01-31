<script>
  import { projectList } from '../../lib/datastore';
  import ProjectListItem from '../../components/ProjectListItem/ProjectListItem.svelte';
</script>

<h1>Låter</h1>
<div class="main-wrapper">
  <div><ProjectListItem newProject={true} /></div>
  {#each $projectList as project}
    <div><ProjectListItem title={project.name} id={project._id} /></div>
  {/each}
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .main-wrapper > div {
    flex: 0 1 auto;
    width: 18vw;
    height: 18vw;
    margin: 1vw;
  }
</style>
