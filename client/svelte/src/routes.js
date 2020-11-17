import ProjectHome from "./ProjectHome/ProjectHome.svelte";
// import ProjectDisplay from "./Navbar.svelte";
import Homepage from "./Homepage/Homepage.svelte";
const routes = [
	{
		name: "/",
		component: Homepage,
	},
	{
		name: "project/:id",
		component: ProjectHome,
	},
	// { name: "login", component: Login, layout: PublicLayout },
	// {
	//   name: "admin",
	//   component: AdminLayout,
	//   onlyIf: { guard: userIsAdmin, redirect: "/login" },
	//   nestedRoutes: [
	//     { name: "index", component: AdminIndex },
	//     {
	//       name: "employees",
	//       component: "",
	//       nestedRoutes: [
	//         { name: "index", component: EmployeesIndex },
	//         { name: "show/:id", component: EmployeesShow },
	//       ],
	//     },
	//   ],
	// },
];

export { routes };
