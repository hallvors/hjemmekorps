<script>
  export let title = "Prosjekt uten navn"
  export let newProject = false;
</script>

{#if !newProject}
<main>
  <h2>{title}</h2>
</main>


{:else}
<main>
  <div class="plus-sign">
    <svg xmlns="http://www.w3.org/2000/svg" class="iconic-plus-thin injected-svg iconic iconic-lg iconic-main" width="128" height="128" viewBox="0 0 128 128" data-src="/iconic/svg/plus-thin.svg">
      <g class="iconic-plus-thin-lg iconic-container iconic-lg" data-width="128" data-height="128" display="inline">
        <path stroke="#000" stroke-width="2" stroke-linecap="square" class="iconic-property-stroke" d="M64 4v120m60-60h-120" fill="none"></path>
      </g>
    </svg>
  </div>

</main>
{/if}

<style>
  main {
    position: relative;
    border: solid 1px #333;
    width: 300px;
    height: 300px;
    box-shadow: 0px 0px 7px 0px rgba(0,0,0,0.75);
    transition: 0.3s;
  }
  h2 {
    padding: 0 30px;
    text-transform: uppercase;
    font-weight: lighter;
    font-size: 2em;
    text-align: center;
  }
  .plus-sign {
    position: absolute;
    width: 128px;
    height: 128px;
    top: calc(50% - 64px);
    left: calc(50% - 64px);
  }
  main:hover {
    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.75);
    cursor: pointer;
  }
</style>
