import ProjectDisplay from "./ProjectDisplay.svelte";
import Homepage from "./Homepage.svelte";
const routes = [
  {
    name: "/",
    component: Homepage,
  },
  {
    name: "about",
    component: ProjectDisplay,
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
