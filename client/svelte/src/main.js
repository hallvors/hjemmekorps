import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    backgroundColor: "#fbfbfb",
    navbarColor: "#7B91F0",
  },
});

export default app;
