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
                <h4>Create your first listing</h4>
                <img
                  src="https://plchldr.co/i/500x300?&bg=dddddd&fc=666666&text=Add+Product"
                />
              </div>

              <div class="guide-step">
                <h4>Set ethical ratings</h4>
                <img
                  src="https://plchldr.co/i/500x300?&bg=dddddd&fc=666666&text=Ethical+Values"
                />
              </div>

              <div class="guide-step">
                <h4>Manage your catalogue</h4>
                <img
                  src="https://plchldr.co/i/500x300?&bg=dddddd&fc=666666&text=Manage+Listings"
                />
              </div>
            `
          : html`
              <p>
                This quick tour will show you how to discover products that
                match your values and shop with confidence on BuyRight.
              </p>

              <div class="guide-step">
                <h4>Search or browse categories</h4>
                <img
                  src="https://plchldr.co/i/500x300?&bg=dddddd&fc=666666&text=Search+%26+Filter"
                />
              </div>

              <div class="guide-step">
                <h4>Check ethical scores</h4>
                <img
                  src="https://plchldr.co/i/500x300?&bg=dddddd&fc=666666&text=Ethical+Bars"
                />
              </div>

              <div class="guide-step">
                <h4>Save favourites</h4>
                <img
                  src="https://plchldr.co/i/500x300?&bg=dddddd&fc=666666&text=Favourites"
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
