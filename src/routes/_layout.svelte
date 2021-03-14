<script context="module">
  // Sort of a hack, but the best hack :)
  // We want local data store initialized with data
  // from server session, no matter what URL you hit
  // first. So we (ab)use _layout to make sure server
  // session data is passed on to the client-side 
  // data store on *any* page.
	export function preload(page, session) {
	  return { session: session };
	}
  </script>
  
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

  // add session data from server to global data store
  export let session
	import {setSession} from '../lib/datastore'
	setSession(session)
</script>

<Navbar style="margin-top:0;"/>

<main>
  <slot />
</main>

<Footer />

<style>
  main {
    position: relative;
    background-color: var(--light);
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
    margin-top: var(--navbarHeight);
  }
  @media (min-width: 1280px) {
    main {
      max-width: 70vw;
    }
  }
</style>
