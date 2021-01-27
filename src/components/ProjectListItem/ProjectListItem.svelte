<script>
  import LinkedBox from '../LinkedBox/LinkedBox.svelte';
  export let title = 'Prosjekt uten navn';
  export let newProject = false;
  export let id = '';
</script>

{#if !newProject}
  <LinkedBox href={'/prosjekt/' + id} {title} />
{:else}
  <LinkedBox href="/prosjekt/nytt">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="iconic-plus-thin injected-svg iconic iconic-lg iconic-main"
      width="128"
      height="128"
      viewBox="0 0 128 128"
      data-src="/iconic/svg/plus-thin.svg">
      <g
        class="iconic-plus-thin-lg iconic-container iconic-lg"
        data-width="128"
        data-height="128"
        display="inline">
        <path
          stroke="#000"
          stroke-width="2"
          stroke-linecap="square"
          class="iconic-property-stroke"
          d="M64 4v120m60-60h-120"
          fill="none"
        />
      </g>
    </svg>
  </LinkedBox>
{/if}
