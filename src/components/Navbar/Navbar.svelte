<script>
  import AdminNavbar from './AdminNavbar.svelte';
  import MemberNavbar from './MemberNavbar.svelte';
  import { user, bands, selectedBand } from '../../lib/datastore';
  let logo;
  let backgroundColor;
  let foregroundColor;
  let band = $bands[$selectedBand];

  if (band) {
    logo = band.logoUrl;
    backgroundColor = band.palette.darkVibrant.background;
    foregroundColor = band.palette.darkVibrant.foreground;
  }
</script>

<main style="background-color: {backgroundColor}; color: {foregroundColor}">
  {#if $user && $user._type === 'adminUser'}
    <AdminNavbar {logo} {foregroundColor} user={$user} />
  {:else if $user && $user._type === 'member'}
    <MemberNavbar {logo} {foregroundColor} user={$user} />
  {/if}
</main>

<style>
  main {
    position: fixed;
    top: 0;
    z-index: 100;
    height: var(--navbarHeight);
    width: 100%;
  }
</style>
