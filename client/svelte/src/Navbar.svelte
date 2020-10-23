<script>
	export let logosrc = "images/music.png"
  export let backgroundColor = "#333";
</script>

<div style="background-color: {backgroundColor};" class="navbar-wrapper">
	<img class="logo" src={logosrc} alt="Noter">
	<ul>
		<li> <a class="navbar-elm" href="#">Nytt Prosjekt</a> </li>
		<li> <a class="navbar-elm" href="#">Placeholder</a> </li>
		<li> <a class="navbar-elm" href="#">Innstillinger</a> </li>
	</ul>
</div>

<style>
	.navbar-wrapper {
		display: flex;
		justify-content: space-between;
		align-items: center;

		height: 100px;
		font-size: 1.3em;
	}

	.logo {
		color: red;
		height: 100%;
		margin-left: 20px;
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
