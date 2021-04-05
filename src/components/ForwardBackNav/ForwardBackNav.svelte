<script>
  export let forward = '';
  export let back = '';
  export let id = '';
  import Back from '../Back/Back.svelte';
  import Forward from '../Forward/Forward.svelte';
</script>
<nav>
    <Back {id} href={back} />
    <Forward {id} href={forward} />
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-between;
  }
</style>
