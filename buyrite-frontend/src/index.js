// Entry point – loads global styles/components and runs App.init().
import App from "./App.js";

// components (custom web components)
import "./components/br-app-header";

// styles
import "./scss/master.scss";

// app.init
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
