import { LitElement, html, css } from "@polymer/lit-element";
import { anchorRoute, gotoRoute } from "../Router";
import Auth from "../Auth";
import App from "../App";

// simple app header component using Lit
customElements.define(
  "br-app-header",
  class AppHeader extends LitElement {
    constructor() {
      super();
    }

    // public props passed in from parent
    static get properties() {
      return {
        title: { type: String },
        user: { type: Object }
      };
    }

    // runs after first render – safe to access shadow DOM
    firstUpdated() {
      super.firstUpdated();
      this.navActiveLinks();
    }

    // highlight current route in header + side nav
    navActiveLinks() {
      const currentPath = window.location.pathname;
      const navLinks = this.shadowRoot.querySelectorAll(
        ".app-top-nav a, .app-side-menu-items a"
      );
      navLinks.forEach((navLink) => {
        if (navLink.href.slice(-1) === "#") return;
        if (navLink.pathname === currentPath) {
          navLink.classList.add("active");
        }
      });
    }

    // open side drawer menu (mobile + desktop)
    hamburgerClick() {
      const appMenu = this.shadowRoot.querySelector(".app-side-menu");
      if (appMenu) appMenu.show();
    }

    // handle clicks inside the side menu and route after closing
    menuClick(e) {
      e.preventDefault();
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const pathname = anchor.pathname;
      const appSideMenu = this.shadowRoot.querySelector(".app-side-menu");

      // if no drawer (just in case), navigate directly
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

      // wait for drawer to fully hide before routing
      appSideMenu.addEventListener("sl-after-hide", onAfterHide, { once: true });

      appSideMenu.hide();
    }

    // sign out from within the drawer
    drawerSignOut(e) {
      if (e) e.preventDefault();
      const appSideMenu = this.shadowRoot.querySelector(".app-side-menu");
      if (appSideMenu) {
        appSideMenu.addEventListener(
          "sl-after-hide",
          () => {
            Auth.signOut();
          },
          { once: true }
        );
        appSideMenu.hide();
      } else {
        Auth.signOut();
      }
    }

    // shared logic: where "home" should go
    getHomeRoute() {
      const currentUser = Auth.currentUser || null;
      const isLoggedIn = !!currentUser;
      const isVendor = isLoggedIn && Number(currentUser.accessLevel) === 2;

      if (isVendor) return "/vendor";
      if (isLoggedIn) return "/consumer";
      return "/";
    }

    // util: retrigger logo bounce animation every time
    bounceLogo(imgEl) {
      if (!imgEl) return;

      imgEl.classList.remove("logo-bounce");
      // force reflow so animation can restart
      void imgEl.offsetWidth;
      imgEl.classList.add("logo-bounce");
    }

    handleHeaderLogoClick(e) {
      const img = e.currentTarget.querySelector("img");
      this.bounceLogo(img);
      gotoRoute(this.getHomeRoute());
    }

    handleHeaderLogoHover(e) {
      const img = e.currentTarget.querySelector("img");
      this.bounceLogo(img);
    }

    handleSideLogoClick(e) {
      this.bounceLogo(e.currentTarget);
      gotoRoute(this.getHomeRoute());
    }

    handleSideLogoHover(e) {
      this.bounceLogo(e.currentTarget);
    }

    render() {
      // pick up auth state directly from Auth helper
      const currentUser = Auth.currentUser || null;
      const isLoggedIn = !!currentUser;
      const isVendor = isLoggedIn && Number(currentUser.accessLevel) === 2;

      // decide if we're in "mobile" layout context
      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(max-width: 768px)").matches;

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

          /* centered logo over the header */
          .app-header-logo {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            z-index: 5;
            cursor: pointer;
          }

          .app-header-logo img {
            height: 15vh;
            width: auto;
            display: block;
            transition: transform 0.2s ease-out;
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
            cursor: pointer;
            transition: transform 0.2s ease-out;
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

          /* hide top nav (including avatar dropdown) on mobile,
             tweak logo size, and hide the header page title to reduce clutter */
          @media all and (max-width: 768px) {
            .app-top-nav {
              display: none;
            }

            /* 50% larger mobile logo */
            .app-header-logo img {
              height: 84px;
            }

            .page-title {
              display: none;
            }
          }

          /* ==========================
             LOGO BOUNCE ANIMATION
             ========================== */

          .logo-bounce {
            animation: logoBounce 0.6s ease;
          }

          @keyframes logoBounce {
            0%,
            100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-6px);
            }
            60% {
              transform: translateY(3px);
            }
          }
        </style>

        <header class="app-header" tabindex="-1">
          <!-- hamburger for small + desktop -->
          <sl-icon-button
            class="hamburger-btn"
            name="list"
            @click="${this.hamburgerClick}"
            style="font-size: 1.5em;"
          ></sl-icon-button>

          <!-- centered logo in the header (clickable "home") -->
          <div
            class="app-header-logo"
            @click="${this.handleHeaderLogoClick}"
            @mouseenter="${this.handleHeaderLogoHover}"
          >
            <img src="/images/logo.svg" alt="BuyRight" />
          </div>

          <div class="app-header-main">
            ${this.title ? html`<h1 class="page-title">${this.title}</h1>` : ``}
            <slot></slot>
          </div>

          <!-- desktop nav (hidden on mobile) -->
          <nav class="app-top-nav">
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
                        >View Profile</sl-menu-item
                      >
                      <sl-menu-item @click="${() => gotoRoute("/editProfile")}"
                        >Edit Profile</sl-menu-item
                      >
                      ${isVendor
                        ? html`
                            <sl-menu-item
                              @click="${() => gotoRoute("/vendor")}"
                              >Vendor Dashboard</sl-menu-item
                            >
                          `
                        : ""}
                      <sl-menu-item @click="${() => gotoRoute("/about")}"
                        >About &amp; Support</sl-menu-item
                      >
                      <sl-menu-item @click="${() => Auth.signOut()}"
                        >Sign Out</sl-menu-item
                      >
                    </sl-menu>
                  </sl-dropdown>
                `}
          </nav>
        </header>

        <!-- side drawer nav -->
        <sl-drawer class="app-side-menu" placement="left">
          <!-- sidebar logo now also links home, but only navigates on click -->
          <img
            class="app-side-menu-logo"
            src="/images/logo.svg"
            alt="BuyRight"
            @click="${this.handleSideLogoClick}"
            @mouseenter="${this.handleSideLogoHover}"
          />
          <nav class="app-side-menu-items">
            ${!isLoggedIn
              ? html`
                  <a href="/signin" @click="${this.menuClick}">Sign In</a>
                  <a href="/signup" @click="${this.menuClick}">Sign Up</a>
                `
              : isVendor
              ? html`
                  <!-- vendor navigation first -->
                  <a href="/vendor" @click="${this.menuClick}">
                    Vendor Dashboard
                  </a>
                  <a href="/vendor/manageProducts" @click="${this.menuClick}">
                    Manage Listings
                  </a>
                  <a href="/vendor/previewProducts" @click="${this.menuClick}">
                    Preview Items
                  </a>

                  <!-- then profile/options, but ONLY on mobile -->
                  ${isMobile
                    ? html`
                        <a href="/profile" @click="${this.menuClick}">
                          View Profile
                        </a>
                        <a href="/editProfile" @click="${this.menuClick}">
                          Edit Profile
                        </a>
                        <a href="/about" @click="${this.menuClick}">
                          About &amp; Support
                        </a>
                        <a href="#" @click="${this.drawerSignOut}">
                          Sign Out
                        </a>
                      `
                    : ""}
                `
              : html`
                  <!-- consumer navigation: "Consumer interface" label -->
                  <a href="/consumer" @click="${this.menuClick}">
                    Consumer interface
                  </a>
                  <a href="/questionnaire" @click="${this.menuClick}">
                    Questionnaire
                  </a>

                  <!-- then profile/options, but ONLY on mobile -->
                  ${isMobile
                    ? html`
                        <a href="/profile" @click="${this.menuClick}">
                          View Profile
                        </a>
                        <a href="/editProfile" @click="${this.menuClick}">
                          Edit Profile
                        </a>
                        <a href="/about" @click="${this.menuClick}">
                          About &amp; Support
                        </a>
                        <a href="#" @click="${this.drawerSignOut}">
                          Sign Out
                        </a>
                      `
                    : ""}
                `}
          </nav>
        </sl-drawer>
      `;
    }
  }
);
