<script>

	import { stores } from '@sapper/app';
	const { session } = stores();

	let user;
	session.subscribe(data => {
		user = data.user;
	});
</script>

<main>
    <h1>Hei {user.name}!</h1>
</main>
<style>
    main {
        text-align: center;
    }
</style>