import App from "./../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "./../../Router";
import Auth from "./../../Auth";
import Utils from "./../../Utils";
import Toast from "./../../Toast";
import ProductAPI from "./../../ProductAPI";

class vendorManageListingsView {
  init() {
    console.log("vendorManageListingsView.init");
    document.title = "Manage Listings";

    // Vendor guard
    if (!Auth.currentUser || Number(Auth.currentUser.accessLevel) !== 2) {
      gotoRoute("/");
      return;
    }

    this.listings = [];
    this.editingListing = null; // listing being edited, or null

    this.render();
    Utils.pageIntroAnim();

    // fetch listings from API
    this.getListings();
  }

  async getListings() {
    try {
      this.listings = await ProductAPI.getvendorManageListings();
      this.render();
    } catch (err) {
      console.error(err);
      Toast.show(err.message || "Problem fetching listings", "error");
    }
  }

  async handleListingSubmit(e) {
    e.preventDefault();
    const formData = e.detail.formData; // Shoelace <sl-form> gives FormData

    const submitBtn = document.querySelector(".listing-submit-btn");
    if (submitBtn) submitBtn.setAttribute("loading", "");

    try {
      if (this.editingListing) {
        // UPDATE existing listing
        await ProductAPI.updateListing(this.editingListing._id, formData);
        Toast.show("Listing updated");
      } else {
        // CREATE new listing
        await ProductAPI.createListing(formData);
        Toast.show("Listing created");
      }

      // Reset edit state & reload from API
      this.editingListing = null;
      await this.getListings();
    } catch (err) {
      console.error(err);
      Toast.show(err.message || "Problem saving listing", "error");
    } finally {
      if (submitBtn) submitBtn.removeAttribute("loading");
    }
  }

  handleEditClick(listing) {
    this.editingListing = listing;
    this.render();
  }

  handleCancelEdit() {
    this.editingListing = null;
    this.render();
  }

  async handleDeleteClick(listingId) {
    try {
      await ProductAPI.deleteListing(listingId);
      Toast.show("Listing deleted");
      await this.getListings();
    } catch (err) {
      console.error(err);
      Toast.show(err.message || "Problem deleting listing", "error");
    }
  }

  render() {
    const listing = this.editingListing;
    const listings = this.listings || [];
    const ethical =
      listing && listing.ethicalRatings ? listing.ethicalRatings : {};

    const template = html`
      <br-app-header
        title="Manage Listings"
        user=${JSON.stringify(Auth.currentUser)}
      ></br-app-header>

      <div class="page-content">
        <div class="vendor-layout">
          <!-- LEFT: Listing form -->
          <section class="vendor-form">
            <h2>${listing ? "Edit Listing" : "Create New Listing"}</h2>
            <sl-form
              class="page-form"
              @sl-submit=${this.handleListingSubmit.bind(this)}
            >
              <div class="input-group">
                <sl-input
                  name="title"
                  type="text"
                  label="Product Name"
                  placeholder="e.g. Organic Fair-Trade Coffee Beans"
                  required
                  value=${listing ? listing.title : ""}
                ></sl-input>
              </div>

              <div class="input-group">
                <sl-select
                  name="category"
                  label="Category"
                  placeholder="Select a category"
                  value=${listing ? listing.category : ""}
                >
                  <sl-menu-item value="grocery">Grocery</sl-menu-item>
                  <sl-menu-item value="household">Household</sl-menu-item>
                  <sl-menu-item value="fashion">Fashion</sl-menu-item>
                  <sl-menu-item value="personal-care"
                    >Personal Care</sl-menu-item
                  >
                  <sl-menu-item value="other">Other</sl-menu-item>
                </sl-select>
              </div>

              <div class="input-group">
                <sl-input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Price (AUD)"
                  placeholder="e.g. 12.95"
                  required
                  value=${listing ? listing.price : ""}
                ></sl-input>
              </div>

              <div class="input-group">
                <sl-textarea
                  name="description"
                  rows="4"
                  label="Description"
                  placeholder="Describe the product & its ethical credentials"
                  >${listing ? listing.description || "" : ""}</sl-textarea
                >
              </div>

              <!-- Ethical profile inputs -->
              <div class="input-group">
                <h3>Ethical profile</h3>
                <p class="ethical-help">
                  Rate this product on key ethical dimensions from 0–5. These
                  scores will be used to match your products to shopper
                  preferences.
                </p>
              </div>

              <div class="input-group">
                <sl-select
                  name="eth_animalWelfare"
                  label="Animal welfare"
                  required
                  value=${ethical.animalWelfare !== undefined
                    ? String(ethical.animalWelfare)
                    : "3"}
                >
                  <sl-menu-item value="0">0 – Not applicable / unknown</sl-menu-item>
                  <sl-menu-item value="1">1 – Very poor</sl-menu-item>
                  <sl-menu-item value="2">2 – Below average</sl-menu-item>
                  <sl-menu-item value="3">3 – Acceptable baseline</sl-menu-item>
                  <sl-menu-item value="4">4 – Strong</sl-menu-item>
                  <sl-menu-item value="5">5 – Outstanding</sl-menu-item>
                </sl-select>
              </div>

              <div class="input-group">
                <sl-select
                  name="eth_humanitarian"
                  label="Humanitarian / labour"
                  required
                  value=${ethical.humanitarian !== undefined
                    ? String(ethical.humanitarian)
                    : "3"}
                >
                  <sl-menu-item value="0">0 – Not applicable / unknown</sl-menu-item>
                  <sl-menu-item value="1">1 – Very poor</sl-menu-item>
                  <sl-menu-item value="2">2 – Below average</sl-menu-item>
                  <sl-menu-item value="3">3 – Acceptable baseline</sl-menu-item>
                  <sl-menu-item value="4">4 – Strong</sl-menu-item>
                  <sl-menu-item value="5">5 – Outstanding</sl-menu-item>
                </sl-select>
              </div>

              <div class="input-group">
                <sl-select
                  name="eth_sustainability"
                  label="Sustainability (materials & lifecycle)"
                  required
                  value=${ethical.sustainability !== undefined
                    ? String(ethical.sustainability)
                    : "3"}
                >
                  <sl-menu-item value="0">0 – Not applicable / unknown</sl-menu-item>
                  <sl-menu-item value="1">1 – Very poor</sl-menu-item>
                  <sl-menu-item value="2">2 – Below average</sl-menu-item>
                  <sl-menu-item value="3">3 – Acceptable baseline</sl-menu-item>
                  <sl-menu-item value="4">4 – Strong</sl-menu-item>
                  <sl-menu-item value="5">5 – Outstanding</sl-menu-item>
                </sl-select>
              </div>

              <div class="input-group">
                <sl-select
                  name="eth_environmentalism"
                  label="Environmental impact (carbon, pollution, land use)"
                  required
                  value=${ethical.environmentalism !== undefined
                    ? String(ethical.environmentalism)
                    : "3"}
                >
                  <sl-menu-item value="0">0 – Not applicable / unknown</sl-menu-item>
                  <sl-menu-item value="1">1 – Very poor</sl-menu-item>
                  <sl-menu-item value="2">2 – Below average</sl-menu-item>
                  <sl-menu-item value="3">3 – Acceptable baseline</sl-menu-item>
                  <sl-menu-item value="4">4 – Strong</sl-menu-item>
                  <sl-menu-item value="5">5 – Outstanding</sl-menu-item>
                </sl-select>
              </div>

              <div class="input-group">
                <label>Primary Image</label><br />
                <input type="file" name="image" accept="image/*" />
                <p class="image-help">
                  Upload a clear product image (JPG/PNG). Existing images will
                  be kept unless you upload a new one when editing.
                </p>
              </div>

              <div class="button-row">
                <sl-button type="primary" submit class="listing-submit-btn">
                  ${listing ? "Save Changes" : "Create Listing"}
                </sl-button>
                ${listing
                  ? html`
                      <sl-button
                        type="default"
                        @click=${this.handleCancelEdit.bind(this)}
                        >Cancel</sl-button
                      >
                    `
                  : ""}
              </div>
            </sl-form>
          </section>

          <!-- RIGHT: Existing listings -->
          <section class="vendor-listings">
            <h2>Your Listings</h2>

            ${listings.length === 0
              ? html`<p>You don’t have any listings yet.</p>`
              : html`
                  <div class="listing-grid">
                    ${listings.map(
                      (l) => html`
                        <sl-card class="listing-card">
                          ${l.image
                            ? html`
                                <img
                                  slot="image"
                                  src="${App.apiBase}/images/${l.image}"
                                  alt="${l.title}"
                                />
                              `
                            : ""}
                          <h3 slot="header">${l.title}</h3>

                          <div class="listing-meta">
                            <span class="chip">
                              ${(l.category || "uncategorised").toUpperCase()}
                            </span>
                            <span class="price">
                              $${Number(l.price || 0).toFixed(2)}
                            </span>
                          </div>

                          <p>
                            ${l.description ||
                            "No description provided. Add one to help shoppers understand your product and its ethical credentials."}
                          </p>

                          <div slot="footer" class="listing-actions">
                            <sl-button
                              size="small"
                              @click=${() => this.handleEditClick(l)}
                              >Edit</sl-button
                            >
                            <sl-button
                              size="small"
                              variant="danger"
                              @click=${() => this.handleDeleteClick(l._id)}
                              >Delete</sl-button
                            >
                          </div>
                        </sl-card>
                      `
                    )}
                  </div>
                `}
          </section>
        </div>
      </div>
    `;

    render(template, App.rootEl);
  }
}

export default new vendorManageListingsView();
