
<script>
	import Navbar from "./Navbar.svelte"

	export let name = "på deg!";
</script>
<div class="navbar">
	<Navbar backgroundColor="#7B91F0"/>
</div>


<style>
	.navbar {
		position: fixed;
		width: 100%;
	}
</style>
