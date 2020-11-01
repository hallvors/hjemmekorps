<script>
	export let logosrc = "../images/music.png"
	export let backgroundColor = "red";
	export let navbarHeight;
	const projectId = 1;
</script>

<div style="background-color: {backgroundColor}; height: {navbarHeight}" class="navbar-wrapper">
	<a href="/about" class="logo"><img class="logo" src={logosrc} alt="Noter"></a>
	<ul>
		<li> <a class="navbar-elm" href="#">Nytt Prosjekt</a> </li>
		<li> <a class="navbar-elm" href="#">Placeholder</a> </li>
		<li> <a class="navbar-elm" href="/project/{projectId}">Innstillinger</a> </li>
	</ul>
</div>

<style>
	.navbar-wrapper {
		position: fixed;
		width: 100%;
		z-index: 10;

		display: flex;
		justify-content: space-between;
		align-items: center;

		/* height: 100px; */
		font-size: 1.3em;
	}

	.logo {
		color: red;
		height: 100%;
		margin-left: 10px;
	}

	ul {
		padding: 0 ;
		list-style: none;
		display: flex;
		justify-content: space-around;
	}

	.navbar-elm {
		color: #6EF086;
		padding: 0 50px 0 50px;
	}
</style>
