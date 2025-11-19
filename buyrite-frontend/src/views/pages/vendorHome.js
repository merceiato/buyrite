// Vendor dashboard home – quick links into vendor tools.
import App from "./../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "./../../Router";
import Auth from "./../../Auth";
import Utils from "./../../Utils";
import moment from "moment";

class VendorHomeView {
  init() {
    console.log("VendorHomeView.init");
    document.title = "Vendor Dashboard";

    // Guard: only allow vendors (accessLevel 2)
    if (!Auth.currentUser || Auth.currentUser.accessLevel !== 2) {
      // send non-vendors back to consumer home (or profile, etc.)
      gotoRoute("/consumer");
      return;
    }

    this.render();
    Utils.pageIntroAnim();
  }

  render() {
    const template = html`
      <br-app-header
        title="Vendor Dashboard"
        user=${JSON.stringify(Auth.currentUser)}
      ></br-app-header>

      <div class="page-content">
        <h2>Welcome, ${Auth.currentUser.firstName}</h2>
        <p>Role: Vendor</p>
        <p>
          Last updated:
          ${moment(Auth.currentUser.updatedAt).format("MMMM Do YYYY, @ h:mm a")}
        </p>

        <div class="vendor-grid">
          <sl-card class="vendor-card">
            <h3 slot="header">Manage Products</h3>
            <p>
              Add, edit and organise the products you make available to
              shoppers.
            </p>
            <sl-button
              @click=${() => gotoRoute("/vendor/manageProducts")}
              variant="primary"
            >
              Go to Products
            </sl-button>
          </sl-card>

          <sl-card class="vendor-card">
            <h3 slot="header">Brand Profile</h3>
            <p>Tell shoppers about your brand, values and certifications.</p>
            <sl-button @click=${() => gotoRoute("/profile")} variant="default">
              Edit Brand Profile
            </sl-button>
          </sl-card>

          <sl-card class="vendor-card">
            <h3 slot="header">Insights (placeholder)</h3>
            <p>
              In the future this area can show engagement and performance data.
            </p>
          </sl-card>
        </div>
      </div>
    `;
    render(template, App.rootEl);
  }
}

export default new VendorHomeView();
