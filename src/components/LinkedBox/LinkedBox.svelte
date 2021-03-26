<script>
  export let href;
  export let title;
  export let orderbadge;
</script>

<a {href} on:click>
  {#if orderbadge}
    <span class="orderbadge">{orderbadge}</span>
  {/if}
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
    position: relative;
    overflow: hidden;
  }
  a:hover {
    cursor: pointer;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);
  }

  .orderbadge {
    position: absolute;
    top: -1vw;
    left: -3.5vw;
    background: #ccc;
    color: #000;
    padding: 3vw;
    padding-bottom: 0.5vw;
    transform: rotate(-45deg);
    font-size: 1.5vw;
    margin-top: -1.5vw;
  }
</style>
