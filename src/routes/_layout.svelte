<script>
  // This organises the basic layout for all pages:
  // - navbar w logo
  // - slot for main content
  // - footer
  // _layout can _not_ assume that a user session exists.
  // Some pages (/feil/.., /om/..) are available without one

  import Navbar from '../components/Navbar/Navbar.svelte';
  import Footer from '../components/Footer/Footer.svelte';

  // segment will be automatically set to last part of the URL in case
  // of nested routes - https://sapper.svelte.dev/docs#Nested_routes
  //export let segment;
</script>

<Navbar style="margin-top:0;"/>

<main>
  <slot />
</main>

<Footer />

<style>
  main {
    position: relative;
    max-width: 70vw;
    background-color: var(--light);
    padding: 2em;
    margin: 0 auto;	
	box-sizing: border-box;
	margin-top: var(--navbarHeight);
  }
</style>
