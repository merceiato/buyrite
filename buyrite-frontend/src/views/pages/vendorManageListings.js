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
    const formData = e.detail.formData; // Shoelace gives us FormData already

    const submitBtn = document.querySelector(".listing-submit-btn");
    if (submitBtn) submitBtn.setAttribute("loading", "");

    try {
      let product;

      if (this.editingListing) {
        // UPDATE existing listing
        product = await ProductAPI.updateListing(
          this.editingListing._id,
          formData
        );
        Toast.show("Listing updated");
      } else {
        // CREATE new listing
        product = await ProductAPI.createListing(formData);
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

    const template = html`
      <va-app-header
        title="Manage Listings"
        user=${JSON.stringify(Auth.currentUser)}
      ></va-app-header>

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

              <div class="input-group">
                <label>Primary Image</label><br />
                <input type="file" name="image" accept="image/*" />
                <p
                  style="font-size: 0.8em; color: #666; margin-top: 0.25em; max-width: 36rem;"
                >
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

      <style>
        .vendor-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.5fr);
          gap: 2rem;
        }

        .vendor-form,
        .vendor-listings {
          background: #fff;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .vendor-form h2,
        .vendor-listings h2 {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .button-row sl-button + sl-button {
          margin-left: 0.5rem;
        }

        .listing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .listing-card {
          height: 100%;
        }

        .listing-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .chip {
          display: inline-block;
          padding: 0.1rem 0.6rem;
          border-radius: 999px;
          background: #eef2f3;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .price {
          font-weight: bold;
        }

        .listing-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        @media (max-width: 900px) {
          .vendor-layout {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    render(template, App.rootEl);
  }
}

export default new vendorManageListingsView();
