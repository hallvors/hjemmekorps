<script>
	export let user;
	import AdminHome from "../AdminHome/AdminHome.svelte";
	import UserHome from "../UserHome/UserHome.svelte";
	import GuestHome from "../GuestHome/GuestHome.svelte";
</script>
<div>
	{#if user && user._type === 'adminUser'}
		<AdminHome {user} />
	{:else if user && user._type === 'member'}
		<UserHome {user} />
	{:else}
		<GuestHome />
	{/if}
</div>
