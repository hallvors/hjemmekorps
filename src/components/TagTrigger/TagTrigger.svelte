<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let tagName;
  export let tagValue;
  export let tagRendered = '';
  export let tagIcon = '';
  export let active = false;
  export let enabled = true;
  export let className = 'fa-tag';
  export let classNameActive = 'fa-tag';

  function toggle() {
    if (!enabled) {
      return;
    }
    if (active) {
      dispatch('deactivate', { tagValue, tagName });
    } else {
      dispatch('activate', { tagValue, tagName });
    }
  }
</script>

<button class:active disabled={!enabled} on:click={toggle}>
  {#if tagIcon}
    <img src={tagIcon} alt={tagName} />
  {:else}
    <i class={"fas " + (active ? classNameActive : className)} />
  {/if}
  {tagRendered || tagValue}
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
