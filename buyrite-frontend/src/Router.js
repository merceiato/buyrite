// import views
// import homeView from "./views/pages/home";
import fourOFourView from "./views/pages/404";
import signinView from "./views/pages/signin";
import signupView from "./views/pages/signup";
import profileView from "./views/pages/profile";
import editProfileView from "./views/pages/editProfile";
import guideView from "./views/pages/guide";
import buyriteView from "./views/pages/buyrite";
import vendorHomeView from "./views/pages/vendorHome";
import vendorManageListingsView from "./views/pages/vendorManageListings";
import vendorPreviewListingsView from "./views/pages/vendorPreviewItems";
import consumerHomeView from "./views/pages/consumerHome";
import questionnaireView from "./views/pages/questionnaire";
import aboutView from "./views/pages/about";



// define routes
const routes = {
  "/": signinView,
  404: fourOFourView,
  "/signin": signinView,
  "/signup": signupView,
  "/profile": profileView,
  "/editProfile": editProfileView,
  "/guide": guideView,
  "/buyrite": buyriteView,
  "/editProfile": editProfileView,
  "/vendor": vendorHomeView,
  "/vendor/manageProducts": vendorManageListingsView,
  "/vendor/previewProducts": vendorPreviewListingsView,
  "/consumer": consumerHomeView,
  "/questionnaire": questionnaireView,
  "/about": aboutView,  
};

class Router {
  constructor() {
    this.routes = routes;
    this.currentView = null;
    this.initialised = false;
    this.handlePopstate = this.handlePopstate.bind(this);
  }

  init() {
    // prevent multiple initialisation and duplicate listeners
    if (this.initialised) return;
    this.initialised = true;

    // initial call
    this.route(window.location.pathname);

    // on back/forward
    window.addEventListener("popstate", this.handlePopstate);
  }

  handlePopstate() {
    this.route(window.location.pathname);
  }

  route(fullPathname) {
    // extract path without params
    const pathname = fullPathname.split("?")[0];
    const view = this.routes[pathname];

    if (view && typeof view.init === "function") {
      // optional destroy hook on previous view
      if (this.currentView && typeof this.currentView.destroy === "function") {
        this.currentView.destroy();
      }

      this.currentView = view;
      view.init();
    } else {
      const fourOFour = this.routes[404];
      if (fourOFour && typeof fourOFour.init === "function") {
        fourOFour.init();
      }
    }
  }

  gotoRoute(pathname) {
    // push new history state and render the route
    window.history.pushState({}, pathname, window.location.origin + pathname);
    this.route(pathname);
  }
}

// create appRouter instance and export
const AppRouter = new Router();
export default AppRouter;

// programmatically load any route
export function gotoRoute(pathname) {
  AppRouter.gotoRoute(pathname);
}

// allows anchor <a> links to load routes
export function anchorRoute(e) {
  e.preventDefault();
  const anchor = e.target.closest("a");
  if (!anchor) return;
  const pathname = anchor.pathname;
  AppRouter.gotoRoute(pathname);
}
