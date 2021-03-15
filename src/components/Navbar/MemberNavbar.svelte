<script>
    export let logo;
    export let user;
    export let navbarHeight;
</script>

<div style="height: {navbarHeight}px">
	<!-- Logo -->
	{#if logo}
        <img class="logo" src={logo} alt="Korpslogo">
	{/if}
    <h1>Hei {user.name}!</h1>
</div>
<style>
    h1 {
        text-align: center;
    }

    div {
        padding: 0;
        margin: 0;
        display: flex;
    }

	.logo {
		height: 100%;
		margin-right: 20px;
        flex-basis: 20%;
	}

</style>