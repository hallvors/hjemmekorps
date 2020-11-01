
<script>
	import { Router } from "svelte-router-spa";
	import { routes } from "./routes.js";

	import Route from "svelte-router-spa";

	import Navbar from "./Navbar.svelte";

	// export let backgroundColor = "red";
	export let navbarColor = "green";
	export let navbarHeight = "100px";

	export let currentRoute;
	const params = {}
</script>



<Navbar backgroundColor={navbarColor} navbarHeight={navbarHeight}/>
<div style="padding-top: {navbarHeight}">
	<Router {routes}/>
</div>




<style>
	/* .navbar {
		position: fixed;
		width: 100%;
		z-index: 10;
	} */
</style>
