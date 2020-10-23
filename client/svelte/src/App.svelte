
<script>
	import Navbar from "./Navbar.svelte";
	import ProjectDisplay from "./ProjectDisplay.svelte";

	let projectDisplays = [
		{}
	]
</script>

<div class="navbar">
	<Navbar backgroundColor="#7B91F0"/>
</div>
<div class="main-wrapper">
	<div class="display">
		<ProjectDisplay newProject={true}/>

		{#each displays as display}
			<ProjectDisplay/>
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
		padding-top: 150px;
		width: 80%;
		margin: 0 auto;
	}
	.display {
		display: grid;
		grid-gap: 40px;
		grid-template-columns: 1fr 1fr 1fr;
	}
</style>
