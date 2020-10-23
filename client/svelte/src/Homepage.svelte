
<script>

import ProjectDisplay from "./ProjectDisplay.svelte"

export let backgroundColor = "red";

// Dette får man fra backend, bilde?
let projectDisplays = [
  {
    title: "Star Wars main theme",
  },
  {
    title: "Norge i rødt, hvitt og blått",
  },
  {
    title: "Game of thrones",
  },
]
</script>


<div class="main-wrapper">
<div class="display">
  <ProjectDisplay newProject={true}/>

  {#each projectDisplays as display}
    <ProjectDisplay title={display.title}/>
  {/each}
</div>
</div>



<style>

.main-wrapper {
  padding: 150px 0;
  width: 80%;
  margin: 0 auto;

}
.display {
  display: grid;
  grid-gap: 40px;
  grid-template-columns: 1fr 1fr 1fr;
}
</style>
