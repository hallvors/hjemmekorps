<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let tagName;
  export let tagValue;
  export let tagRendered = '';
  export let tagIcon = '';
  export let active = false;

  function toggle() {
    if (active) {
      dispatch('deactivate');
    } else {
      dispatch('activate', {tagValue, tagName});
    }
  }
</script>

<button class:active on:click={toggle}>
  {#if tagIcon}
    <img src={tagIcon} alt={tagName} />
  {:else}
    <i class="fas fa-tag" />
  {/if}
  { tagRendered || tagValue}
</button>

<style>
    button {
      width: 100%;
    }
    button img {
        max-width: 24px;
    }
  .active {
    border-color: green;
    color: #030;
    background: #afa;
    font-weight: bolder;
  }
</style>
