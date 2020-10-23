
<script>
	// import { Router } from "svelte-router-spa";
	// import { routes } from "./routes.js"

	import Navbar from "./Navbar.svelte";
	import Homepage from "./Homepage.svelte"

	export let backgroundColor = "red";
	export let navbarColor = "green";

</script>


<div class="navbar">
	<Navbar backgroundColor={navbarColor}/>
</div>
<Homepage backgroundColor={backgroundColor}/>



<style>
	.navbar {
		position: fixed;
		width: 100%;
		z-index: 100;
	}

	.main-wrapper {
		padding: 150px 0;
		width: 80%;
		margin: 0 auto;

	}
	.display {
		display: grid;
		grid-gap: 40px;
		grid-template-columns: 1fr 1fr 1fr;
	}
</style>
