
<script>
	import { Router, Route } from "svelte-routing";
	import Homepage from "./Homepage/Homepage.svelte";
	import ProjectMain from "./ProjectMain/ProjectMain.svelte";
	import {user, projects, bands} from './stores.js';
	fetch('/api/users/me').then(result => result.json().then(user.set));
	fetch('/api/bands/').then(result => result.json().then(bands.set));
	fetch('/api/projects/').then(result => result.json().then(projects.set));
	// OLD ROUTER
	// import { Router } from "svelte-router-spa";
	// import { routes } from "./routes.js";
	// import { Navigate } from "svelte-router-spa";
	// import Route from "svelte-router-spa";
	// export let currentRoute;
	// const params = {}

	import Navbar from "./Navbar.svelte";

	// export let backgroundColor = "red";
	export let navbarColor = "green";
	export let navbarHeight = "100px";

	// NEW ROUTER
	export let url = "";

</script>
<Router url={url}>
	<Navbar backgroundColor={navbarColor} navbarHeight={navbarHeight}/>
	<div style="padding-top: {navbarHeight}">
		<Route path="/" component={Homepage}/>
		<Route path="/project/:id" component={ProjectMain}/>
	</div>
</Router>


<style>
	/* .navbar {
		position: fixed;
		width: 100%;
		z-index: 10;
	} */
</style>
