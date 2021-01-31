<script>
	import AdminNavbar from "./AdminNavbar.svelte";
	import MemberNavbar from "./MemberNavbar.svelte";
	import {user} from '../../lib/datastore'

</script>

<main>
{#if ($user && $user._type === "adminUser")}
	<AdminNavbar/>

	{:else if ($user && $user._type === "member")}
	<MemberNavbar />
{/if}
</main>

<style>
	main {
		position: fixed;
		top: 0;
		z-index: 100;
		background-color: var(--contrastColor);

		height: var(--navbarHeight);
		width: 100%;
	}
</style>