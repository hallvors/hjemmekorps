
<script>
	import { Router } from "svelte-router-spa"

	import { routes } from "./routes.js"

	import Navbar from "./Navbar.svelte";

	// export let backgroundColor = "red";
	export let navbarColor = "green";

</script>


<div class="navbar">
	<Navbar backgroundColor={navbarColor}/>
</div>
<div style="padding-top: 100px">
	<Router {routes}/>
</div>




<style>
	.navbar {
		position: fixed;
		width: 100%;
		z-index: 10;
	}
</style>
