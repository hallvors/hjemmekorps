<script>
  export let href;
  export let title;
  export let orderbadge;
  export let description = '';
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
  {#if description}
    <small class="desc">{description}</small>
  {/if}
</a>

<style>
  a {
    width: 100%;
    height: 100%;
    padding: 5px 20px;
    border: var(--border);
    box-shadow: var(--shadow);
    transition: 0.3s;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
    padding: 0 10%;
    text-transform: uppercase;
    font-weight: lighter;
    font-size: 2vw;
    font-size: max(2vw, 1.4em); /* min-font-size hack*/
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
    transform-origin: 65% 65%;
    margin-top: -1.5vw;
    min-width: 9vw;
  }
  .desc, .desc:hover {
    display: block;
    font-size: smaller;
    text-decoration: none;
    color: var(--textColorDark);
  }
</style>
