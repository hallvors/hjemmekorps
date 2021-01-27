<script>
    export let items;
    import LinkedBox from '../LinkedBox/LinkedBox.svelte'
</script>

<div class="wrapper">
    {#each items as item}
    <div><LinkedBox href={item.href} title={item.title} /></div>
    {/each}
</div>
<style>
    .wrapper {
      padding: 50px 0;
      width: 90%;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
  
    .wrapper > div {
      flex: 0 1 auto;
      width: 18vw;
      height: 18vw;
      margin: 1vw;
    }
  </style>
  