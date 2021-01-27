<script>
  export let href;
  export let title;
</script>

<a {href} on:click>
  {#if title}
    <span>{title}</span>
  {:else}
    <slot />
  {/if}
</a>

<style>
  a {
    display: block;
    width: 100%;
    height: 100%;
    padding: 5px 20px;
    border: var(--border);
    box-shadow: var(--shadow);
    transition: 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
    padding: 0 10%;
    text-transform: uppercase;
    font-weight: lighter;
    font-size: 2vw;
    text-align: center;
  }
  a:hover {
    cursor: pointer;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);
  }
</style>
