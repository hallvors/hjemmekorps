<script>
  import { user } from '../lib/datastore';
  import App from '../components/App/App.svelte';
  console.log($user);
</script>

<svelte:head>
  <title>Hjemmekorps</title>
</svelte:head>

<App user={$user} />
