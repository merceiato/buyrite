// App header web component.
// Handles the top navigation bar, logo and the mobile side drawer.
import { LitElement, html, css } from "@polymer/lit-element";
import { anchorRoute, gotoRoute } from "../Router";
import Auth from "../Auth";
import App from "../App";

customElements.define(
  "br-app-header",
  class AppHeader extends LitElement {
    constructor() {
      super();
    }

    // simple reactive props so parent views can pass in a title and user object
    static get properties() {
      return {
        title: { type: String },
        user: { type: Object },
      };
    }

    firstUpdated() {
      super.firstUpdated();
      this.navActiveLinks();
    }

    // highlight the current route in both the top nav and the drawer
    navActiveLinks() {
      const currentPath = window.location.pathname;
      const navLinks = this.shadowRoot.querySelectorAll(
        ".app-top-nav a, .app-side-menu-items a"
      );
      navLinks.forEach((navLink) => {
        if (navLink.href.slice(-1) == "#") return;
        if (navLink.pathname === currentPath) {
          navLink.classList.add("active");
        }
      });
    }

    // open the side drawer on small screens
    hamburgerClick() {
      const appMenu = this.shadowRoot.querySelector(".app-side-menu");
      if (appMenu) appMenu.show();
    }

    // handle clicks inside the drawer and route using our SPA router
    menuClick(e) {
      e.preventDefault();
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const pathname = anchor.pathname;
      const appSideMenu = this.shadowRoot.querySelector(".app-side-menu");

      // if no drawer is found, just route straight away
      if (!appSideMenu) {
        gotoRoute(pathname);
        return;
      }

      const onAfterHide = () => {
        const header = this.shadowRoot.querySelector(".app-header");
        if (header) header.focus();

        gotoRoute(pathname);
        appSideMenu.removeEventListener("sl-after-hide", onAfterHide);
      };

      appSideMenu.addEventListener("sl-after-hide", onAfterHide, { once: true });

      appSideMenu.hide();
    }

    render() {
      const currentUser = Auth.currentUser || null;
      const isLoggedIn = !!currentUser;
      const isVendor = isLoggedIn && Number(currentUser.accessLevel) === 2;

      return html`
        <style>
          * {
            box-sizing: border-box;
          }

          .app-header {
            background: var(--brand-color);
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            height: var(--app-header-height);
            color: #fff;
            display: flex;
            align-items: center;
            z-index: 9;
            box-shadow: 4px 0px 10px rgba(0, 0, 0, 0.2);
          }

          .app-header:focus {
            outline: none;
          }

          /* centred brand logo that sits over the nav */
          .app-header-logo {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            z-index: 5;
            pointer-events: none; /* allow clicks to nav behind it */
          }

          .app-header-logo img {
            height: 15vh;
            width: auto;
            display: block;
          }

          .app-header-main {
            flex-grow: 1;
            display: flex;
            align-items: center;
          }

          .app-logo img {
            width: 90px;
          }

          .hamburger-btn::part(base) {
            color: #fff;
          }

          .app-top-nav {
            display: flex;
            height: 100%;
            align-items: center;
          }

          .app-top-nav a {
            display: inline-block;
            padding: 0.8em;
            text-decoration: none;
            color: #fff;
          }

          .app-side-menu-items {
            padding-top: 150px;
          }

          .app-side-menu-items a {
            display: block;
            padding: 0.8em;
            text-decoration: none;
            font-size: 1.3em;
            color: #333;
          }

          .app-side-menu-items a + a {
            margin-top: 0.3em;
          }

          .app-side-menu-logo {
            width: 120px;
            margin-bottom: 1em;
            position: absolute;
            top: 2em;
            left: 1.5em;
          }

          .page-title {
            color: var(--app-header-txt-color);
            margin-right: 0.5em;
            font-size: var(--app-header-title-font-size);
          }

          .app-top-nav a.active,
          .app-side-menu-items a.active {
            font-weight: bold;
          }

          @media all and (max-width: 768px) {
            .app-top-nav {
              display: none;
            }
          }
        </style>

        <header class="app-header" tabindex="-1">
          <sl-icon-button
            class="hamburger-btn"
            name="list"
            @click="${this.hamburgerClick}"
            style="font-size: 1.5em;"
          ></sl-icon-button>

          <!-- centred logo over the header bar -->
          <div class="app-header-logo">
            <img src="/images/logo.svg" alt="BuyRight" />
          </div>

          <div class="app-header-main">
            ${this.title ? html`<h1 class="page-title">${this.title}</h1>` : ``}
            <slot></slot>
          </div>

          <nav class="app-top-nav">
            <a href="/" @click="${anchorRoute}">Home</a>

            ${!isLoggedIn
              ? html`
                  <a href="/signin" @click="${anchorRoute}">Sign In</a>
                  <a href="/signup" @click="${anchorRoute}">Sign Up</a>
                `
              : html`
                  <sl-dropdown>
                    <a
                      slot="trigger"
                      href="#"
                      @click="${(e) => e.preventDefault()}"
                    >
                      <sl-avatar
                        style="--size: 24px;"
                        image=${currentUser && currentUser.avatar
                          ? `${App.apiBase}/images/${currentUser.avatar}`
                          : ""}
                      ></sl-avatar>
                      ${currentUser && currentUser.firstName}
                    </a>
                    <sl-menu>
                      <sl-menu-item @click="${() => gotoRoute("/profile")}"
                        >Account</sl-menu-item
                      >
                      <sl-menu-item @click="${() => gotoRoute("/editProfile")}"
                        >Edit Profile</sl-menu-item
                      >
                      ${isVendor
                        ? html`
                            <sl-menu-item @click="${() => gotoRoute("/vendor")}"
                              >Vendor Dashboard</sl-menu-item
                            >
                          `
                        : ""}
                      <sl-menu-item @click="${() => Auth.signOut()}"
                        >Sign Out</sl-menu-item
                      >
                    </sl-menu>
                  </sl-dropdown>
                `}
          </nav>
        </header>

        <sl-drawer class="app-side-menu" placement="left">
          <img class="app-side-menu-logo" src="/images/logo.svg" />
          <nav class="app-side-menu-items">
            ${!isLoggedIn
              ? html`
                  <a href="/signin" @click="${this.menuClick}">Sign In</a>
                  <a href="/signup" @click="${this.menuClick}">Sign Up</a>
                `
              : isVendor
              ? html`
                  <a href="/vendor" @click="${this.menuClick}">
                    Vendor Dashboard
                  </a>
                  <a href="/vendor/manageProducts" @click="${this.menuClick}">
                    Manage Listings
                  </a>
                  <a href="/vendor/previewProducts" @click="${this.menuClick}">
                    Preview Items
                  </a>
                  <a href="/about" @click="${this.menuClick}">
                    About & Support
                  </a>
                `
              : html`
                  <a href="/consumer" @click="${this.menuClick}">Home</a>
                  <a href="/consumer" @click="${this.menuClick}">
                    Consumer Interface
                  </a>
                  <a href="/guide" @click="${this.menuClick}">
                    Questionnaire
                  </a>
                  <a href="/favouriteHaircuts" @click="${this.menuClick}">
                    Saved Items
                  </a>
                  <a href="/about" @click="${this.menuClick}">
                    About & Support
                  </a>
                `}
            ${isLoggedIn
              ? html` <a href="#" @click="${() => Auth.signOut()}">Sign Out</a> `
              : ""}
          </nav>
        </sl-drawer>
      `;
    }
  }
);
