// src/views/pages/guide.js
import App from "./../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "./../../Router";
import Auth from "./../../Auth";
import Utils from "./../../Utils";
import UserAPI from "../../UserAPI";
import Toast from "../../Toast";

class GuideView {
  init() {
    document.title = "Guide";
    this.render();
    Utils.pageIntroAnim();
    this.updateCurrentUser();
  }

  async updateCurrentUser() {
    try {
      const updatedUser = await UserAPI.updateUser(
        Auth.currentUser._id,
        { newUser: false },
        "json"
      );
      console.log("user updated");
      console.log(updatedUser);
    } catch (err) {
      Toast.show(err, "error");
    }
  }

  render() {
    const accessLevel = Number(
      Auth.currentUser && Auth.currentUser.accessLevel
    );
    const isVendor = accessLevel === 2;

    const guide = html`
      <br-app-header
        title="Guide"
        user="${JSON.stringify(Auth.currentUser)}"
      ></br-app-header>

      <div class="page-content calign">
        <h3 class="brand-color">
          Welcome ${Auth.currentUser.firstName}!
        </h3>

        ${isVendor
          ? html`
              <p>
                This quick tour will show you how to list products and manage
                your vendor dashboard in BuyRight.
              </p>

              <div class="guide-step">
                <h4>Navigate to manage listings</h4>
                <img
                  src="http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000/images/br-menu-manage-listings.png"
                />
              </div>

              <div class="guide-step">
                <h4>Crete & Edit listings</h4>
                <img
                  src="http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000/images/br-menu-manage-listings.png"
                />
              </div>

              <div class="guide-step">
                <h4>Preview Listings</h4>
                <img
                  src="http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000/images/br-preview-listings-page.png"
                />
              </div>
            `
          : html`
              <p>
                This quick tour will show you how to discover products that
                match your values and shop with confidence on BuyRight.
              </p>

              <div class="guide-step">
                <h4>Navigate to consumer interface</h4>
                <img
                  src="http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000/images/br-searchbar-categories.png"
                />
              </div>

              <div class="guide-step">
                <h4>Turn on or off ethical filtering</h4>
                <img
                  src="http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000/images/br-categories-page.png"
                />
              </div>

              <div class="guide-step">
                <h4>Refine ethical profile</h4>
                <img
                  src="http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000/images/br-categories-page.png"
                />
              </div>
            `}

        <sl-button
          type="primary"
          @click=${() => gotoRoute(isVendor ? "/vendor" : "/buyrite")}
        >
          Okay got it!
        </sl-button>
      </div>
    `;
    render(guide, App.rootEl);
  }
}

export default new GuideView();
