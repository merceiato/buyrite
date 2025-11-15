import App from "./../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "./../../Router";
import Auth from "./../../Auth";
import Utils from "./../../Utils";
import Toast from "./../../Toast";
import ProductAPI from "./../../ProductAPI";

class vendorPreviewItemsView {
  constructor() {
    this.items = [];
    this.selectedListing = null;
    this.isLoading = false;
    this.error = null;
  }

  async init() {
    console.log("vendorPreviewItemsView.init");
    document.title = "Preview Items";

    // vendor-only guard
    if (!Auth.currentUser || Number(Auth.currentUser.accessLevel) !== 2) {
      gotoRoute("/");
      return;
    }

    this.items = [];
    this.selectedListing = null;
    this.isLoading = true;
    this.error = null;

    this.render();
    Utils.pageIntroAnim();

    await this.getItems();
  }

  async getItems() {
    try {
      // reuse the same API call your manage/edit page uses
      this.items = await ProductAPI.getvendorManageListings();
      this.isLoading = false;

      // auto-select first item if any
      this.selectedListing = this.items.length > 0 ? this.items[0] : null;

      this.render();
    } catch (err) {
      console.error(err);
      this.error = err.message || "Problem fetching items";
      this.isLoading = false;
      Toast.show(this.error, "error");
      this.render();
    }
  }

  // select a listing when user clicks a row on the left
  handleSelectListing(listing) {
    this.selectedListing = listing;
    this.render();
  }

  // go to Manage Listings to edit this item
  gotoEditListing(e, listing) {
    e.stopPropagation();
    // send them to /vendor/manageProducts with ?edit=<id>
    gotoRoute(`/vendor/manageProducts?edit=${listing._id}`);
  }

  // go to Manage Listings to create a new listing
  gotoCreateListing() {
    gotoRoute("/vendor/manageProducts");
  }

  getShortDescription(desc) {
    if (!desc) return "No description provided yet.";
    if (desc.length <= 200) return desc;
    return desc.slice(0, 200) + "…";
  }

  render() {
    const items = this.items || [];
    const selected = this.selectedListing;
    const isLoading = this.isLoading;
    const error = this.error;

    const template = html`
      <va-app-header
        title="Preview Items"
        user=${JSON.stringify(Auth.currentUser)}
      ></va-app-header>

      <div class="page-content preview-layout">
        ${isLoading
          ? html`
              <div class="preview-loading">
                <sl-spinner></sl-spinner>
                <p>Loading your items…</p>
              </div>
            `
          : error
          ? html`<p class="error-msg">${error}</p>`
          : items.length === 0
          ? html`
              <div class="preview-empty">
                <h2>No items yet</h2>
                <p>
                  You haven't created any products. Create one from the Manage
                  Items page.
                </p>
                <sl-button variant="primary" @click=${this.gotoCreateListing}>
                  Go to Manage Items
                </sl-button>
              </div>
            `
          : html`
              <!-- LEFT: list of items -->
              <section class="preview-list-panel">
                <header class="preview-list-header">
                  <h2>Your items</h2>
                  <!-- changed plus-lg -> plus -->
                  <sl-icon-button
                    name="plus"
                    label="Create listing"
                    @click=${this.gotoCreateListing}
                  ></sl-icon-button>
                </header>

                <ul class="preview-list">
                  ${items.map(
                    (l) => html`
                      <li
                        class="preview-list-item ${selected &&
                        selected._id === l._id
                          ? "is-active"
                          : ""}"
                        @click=${() => this.handleSelectListing(l)}
                      >
                        <div class="preview-list-thumb">
                          ${l.image
                            ? html`
                                <img
                                  src="${App.apiBase}/images/${l.image}"
                                  alt="${l.title}"
                                />
                              `
                            : html`<div class="preview-list-thumb--placeholder">
                                No image
                              </div>`}
                        </div>

                        <div class="preview-list-text">
                          <div class="preview-list-title">
                            ${l.title || "Untitled listing"}
                          </div>
                          <div class="preview-list-meta">
                            <span class="preview-list-category">
                              ${(l.category || "uncategorised").toUpperCase()}
                            </span>
                            <span class="preview-list-price">
                              $${Number(l.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div class="preview-list-actions">
                          <!-- changed pencil-square -> pencil -->
                          <sl-icon-button
                            name="pencil"
                            label="Edit listing"
                            @click=${(e) => this.gotoEditListing(e, l)}
                          ></sl-icon-button>
                        </div>
                      </li>
                    `
                  )}
                </ul>
              </section>

              <!-- RIGHT: full preview of selected item -->
              <section class="preview-detail-panel">
                <h2>Customer view</h2>

                ${!selected
                  ? html`<p>Select an item on the left to preview it.</p>`
                  : html`
                      <sl-card class="preview-detail-card">
                        ${selected.image
                          ? html`
                              <img
                                slot="image"
                                src="${App.apiBase}/images/${selected.image}"
                                alt="${selected.title}"
                              />
                            `
                          : ""}

                        <div class="preview-detail-header" slot="header">
                          <div>
                            <h3>${selected.title || "Untitled listing"}</h3>
                            <div class="preview-detail-tags">
                              <span class="chip">
                                ${(
                                  selected.category || "uncategorised"
                                ).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div class="preview-detail-price">
                            $${Number(selected.price || 0).toFixed(2)}
                          </div>
                        </div>

                        <p>${this.getShortDescription(selected.description)}</p>

                        <div slot="footer" class="preview-detail-footer">
                          <small>
                            This is a preview of how shoppers will see this
                            product in the customer interface.
                          </small>
                        </div>
                      </sl-card>
                    `}
              </section>
            `}
      </div>
    `;

    render(template, App.rootEl);
  }
}

export default new vendorPreviewItemsView();
