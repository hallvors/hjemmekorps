<script>
  export let title = "Prosjekt uten navn"
  export let newProject = false;
  export let id = '';
</script>

{#if !newProject}
<main>
  <h2><a href={'/project/' + id}>{title}</a></h2>
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
    border: solid 1px var(--dark);
    width: 25vw;
    height: 25vw;
    box-shadow: 0px 0px 7px 0px rgba(0,0,0,0.75);
    transition: 0.3s;
  }
  h2 {
    padding: 0 10%;
    text-transform: uppercase;
    font-weight: lighter;
    font-size: 2.5vw;
    text-align: center;
  }
  .plus-sign {
    position: absolute;
    /* 64px is half of plus sign-width and height */
    top: calc(50% - 64px);
    left: calc(50% - 64px);
  }
  main:hover {
    box-shadow: 0px 0px 15px 0px rgba(0,0,0,0.75);
    cursor: pointer;
  }
  @media only screen and (min-width: 1200px) {
      main {
    width: 300px;
    height: 300px;
  }
  }
  @media only screen and (max-width: 820px) {
    main {
      width: 40vw;
      height: 40vw;
    }
    h2 {
      font-size: 2em;
    }
  }

  @media only screen and (max-width: 600px) {
    main {
      width: 80vw;
      height: 70vw;
    }
    }
</style>
