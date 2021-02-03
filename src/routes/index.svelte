<script>
  import { user } from '../lib/datastore';
  import App from '../components/App/App.svelte';
</script>

<svelte:head>
  <title>Hjemmekorps</title>
</svelte:head>

<App user={$user} />
