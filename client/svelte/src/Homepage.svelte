<script>
  import ProjectDisplay from './ProjectDisplay.svelte'

  // export let backgroundColor = 'red';

  // Dette får man fra backend, bilde?
  let projectDisplays = [
    {
      title: 'Star Wars main theme',
    },
    {
      title: 'Norge i rødt, hvitt og blått',
    },
    {
      title: 'Game of thrones',
    },
  ]

  // window.addEventListener("resize", (e)=> console.log(e.target.innerWidth))
</script>

<div class="main-wrapper">
  <div class="display">
    <ProjectDisplay newProject={true} />

    {#each projectDisplays as display}
      <ProjectDisplay title={display.title} />
    {/each}
  </div>
</div>

<style>
  .main-wrapper {
    padding: 150px 0;
    width: 90%;
    margin: 0 auto;
  }

  .display {
    display: grid;
    grid-gap: 40px;
    grid-template-columns: 1fr 1fr 1fr;

    justify-items: center;
  }

  /* || Media queries */

  @media only screen and (min-width: 1200px) {    
    .main-wrapper {
      width: 1200px;
    }
  }

  @media only screen and (max-width: 820px) {
    .display {
      grid-template-columns: 1fr 1fr;
  }
    }
  @media only screen and (max-width: 600px) {
    .display {
      grid-template-columns: 1fr;
  }
    }
</style>