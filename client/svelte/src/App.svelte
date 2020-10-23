
<script>
	import Navbar from "./Navbar.svelte";
	import ProjectDisplay from "./ProjectDisplay.svelte";

	export let backgroundColor = "red";
	export let navbarColor;

	// Dette man fra backend, bilde?
	let projectDisplays = [
		{
			title: "Star Wars main theme",
		},
		{
			title: "Norge i rødt, hvitt og blått",
		},
		{
			title: "Game of thrones",
		},
	]
</script>


<div class="navbar">
	<Navbar backgroundColor={navbarColor}/>
</div>
<div class="main-wrapper">
	<div class="display">
		<ProjectDisplay newProject={true}/>

		{#each projectDisplays as display}
			<ProjectDisplay title={display.title}/>
		{/each}
	</div>
</div>



<style>
	.navbar {
		position: fixed;
		width: 100%;
		z-index: 10;
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
