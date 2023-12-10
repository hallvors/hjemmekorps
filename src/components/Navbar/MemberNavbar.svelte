<script>
    export let logo;
    export let user;
    export let navbarHeight;
</script>

<div style="height: {navbarHeight}px">
	<!-- Logo -->
	{#if logo}
        <span class="logo">
		    <a href="/" class="logo" on:click={() => top.location.href = '/'}>
                <img src={logo} alt="Korpslogo">
            </a>
        </span>
	{/if}
    <h1>Hei {user.name}!</h1>
</div>
<style>
    h1 {
        text-align: center;
        flex-basis: 60%;
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
	.logo img {
		max-height: var(--navbarHeight);
	}

</style>