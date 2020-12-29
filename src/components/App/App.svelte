<script>
	import { stores } from '@sapper/app';
	const { session } = stores();
	let user;
	session.subscribe(data => {
		user = data.user;
	});

	/* TODO: load different section of app for regular users (musicians)
			if (user && user._type === 'member')
	*/

	import AdminHome from "../AdminHome/AdminHome.svelte";
</script>
<div>
	{#if user && user._type === 'adminUser'}
		<AdminHome />
	{/if}
</div>
