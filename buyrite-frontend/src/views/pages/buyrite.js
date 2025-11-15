// src/views/pages/buyrite.js
import App from "./../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "./../../Router";
import Auth from "./../../Auth";
import Utils from "./../../Utils";
import Toast from "./../../Toast";
import ProductAPI from "./../../ProductAPI";


class buyriteView {
  constructor() {
    this.products = [];
    this.searchTerm = "";
    this.selectedCategory = "all";
    this.ethicsStrict = false;
    this.isLoading = false;
    this.error = null;
  }

  async init() {
    console.log("buyriteView.init");
    document.title = "Buy Right";

    // must be signed in
    if (!Auth.currentUser) {
      gotoRoute("/signin");
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.render();
    Utils.pageIntroAnim();

    try {
      this.products = await ProductAPI.getPublicProducts();
      this.isLoading = false;
      this.render();
    } catch (err) {
      console.error(err);
      this.error = err.message || "Problem loading products";
      this.isLoading = false;
      Toast.show(this.error, "error");
      this.render();
    }
  }

  // UI event handlers -----------------------

  handleSearchInput(e) {
    this.searchTerm = (e.target.value || "").toLowerCase();
    this.render();
  }

  handleCategoryChange(e) {
    this.selectedCategory = e.target.value || "all";
    this.render();
  }

  handleEthicsYes() {
    this.ethicsStrict = true;
    this.render();
  }

  handleEthicsNo() {
    this.ethicsStrict = false;
    this.render();
  }

  // filtering logic -------------------------

  getFilteredProducts() {
    return (this.products || []).filter((p) => {
      // text search
      const s = this.searchTerm;
      if (s) {
        const haystack = (
          (p.title || "") +
          " " +
          (p.description || "") +
          " " +
          (p.category || "")
        ).toLowerCase();
        if (!haystack.includes(s)) return false;
      }

      // category filter
      if (this.selectedCategory !== "all") {
        if ((p.category || "") !== this.selectedCategory) return false;
      }

      // simple ethics filter:
      // when on, keep products where all ratings are >= 4
      if (this.ethicsStrict) {
        const er = p.ethicalRatings || {};
        const vals = [
          Number(er.animalWelfare),
          Number(er.humanitarian),
          Number(er.sustainability),
          Number(er.environmentalism),
        ];
        if (vals.some((v) => !Number.isFinite(v) || v < 4)) {
          return false;
        }
      }

      return true;
    });
  }

  // rendering helpers -----------------------

// buyrite.js
renderEthicsBars(p) {
  const er = p.ethicalRatings || {};

  const toPct = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return 0;

    // If it's between 0–1, treat as a fraction (0.0–1.0)
    if (n <= 1) return n * 100;

    // If it's between 1–5, treat as a 5-star rating
    if (n <= 5) return (n / 5) * 100;

    // If it's already 0–100, just use it as is
    if (n <= 100) return n;

    // Anything bigger: clamp to 100%
    return 100;
  };

  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : "–";
  };

  return html`
    <div class="buyrite-tile-ethics">
      <div class="buyrite-ethic-row">
        <span class="buyrite-ethic-label">
          Animal welfare (${safeNum(er.animalWelfare)}/5)
        </span>
        <sl-progress-bar
          class="buyrite-ethic-bar"
          .value=${toPct(er.animalWelfare)}
        ></sl-progress-bar>
      </div>

      <div class="buyrite-ethic-row">
        <span class="buyrite-ethic-label">
          Humanitarian (${safeNum(er.humanitarian)}/5)
        </span>
        <sl-progress-bar
          class="buyrite-ethic-bar"
          .value=${toPct(er.humanitarian)}
        ></sl-progress-bar>
      </div>

      <div class="buyrite-ethic-row">
        <span class="buyrite-ethic-label">
          Sustainability (${safeNum(er.sustainability)}/5)
        </span>
        <sl-progress-bar
          class="buyrite-ethic-bar"
          .value=${safeNum(er.sustainability)}/5
        ></sl-progress-bar>
      </div>

      <div class="buyrite-ethic-row">
        <span class="buyrite-ethic-label">
          Environmentalism (${safeNum(er.environmentalism)}/5)
        </span>
        <sl-progress-bar
          class="buyrite-ethic-bar"
          .value=${toPct(er.environmentalism)}
        ></sl-progress-bar>
      </div>
    </div>
  `;
}


  render() {
    const filtered = this.getFilteredProducts();
    const isLoading = this.isLoading;
    const error = this.error;

    const template = html`
      <br-app-header
        title="Buy Right"
        user=${JSON.stringify(Auth.currentUser)}
      ></br-app-header>

      <div class="page-content buyrite-layout">
        <!-- Controls row -->
        <section class="buyrite-controls">
          <div class="buyrite-control">
            <sl-input
              label="Search key words"
              placeholder="Search products…"
              type="search"
              clearable
              @sl-input=${this.handleSearchInput.bind(this)}
            ></sl-input>
          </div>

          <div class="buyrite-control">
            <sl-select
              label="Select category"
              value=${this.selectedCategory}
              @sl-change=${this.handleCategoryChange.bind(this)}
            >
              <sl-menu-item value="all">All categories</sl-menu-item>
              <sl-menu-item value="grocery">Grocery</sl-menu-item>
              <sl-menu-item value="household">Household</sl-menu-item>
              <sl-menu-item value="fashion">Fashion</sl-menu-item>
              <sl-menu-item value="personal-care">Personal Care</sl-menu-item>
              <sl-menu-item value="other">Other</sl-menu-item>
            </sl-select>
          </div>
        </section>

        <!-- Simple ethics question -->
        <section class="buyrite-ethics-question">
          <p class="buyrite-ethics-question__text">
            Only show products with strong ethical credentials?
          </p>
          <div class="buyrite-ethics-question__buttons">
            <sl-button
              size="small"
              variant=${this.ethicsStrict ? "primary" : "default"}
              @click=${this.handleEthicsYes.bind(this)}
              >Yes</sl-button
            >
            <sl-button
              size="small"
              variant=${!this.ethicsStrict ? "primary" : "default"}
              @click=${this.handleEthicsNo.bind(this)}
              >No</sl-button
            >
          </div>
        </section>

        <!-- Grid of items -->
        <section class="buyrite-grid-wrapper">
          ${isLoading
            ? html`
                <div class="buyrite-loading">
                  <sl-spinner></sl-spinner>
                  <p>Loading products…</p>
                </div>
              `
            : error
            ? html`<p class="error-msg">${error}</p>`
            : filtered.length === 0
            ? html`
                <div class="buyrite-empty">
                  <p>No products match your search and filters yet.</p>
                  ${this.ethicsStrict
                    ? html`<p class="hint">
                        Tip: try turning off the ethics filter or broadening
                        your search.
                      </p>`
                    : ""}
                </div>
              `
            : html`
                <div class="buyrite-grid">
                  ${filtered.map(
                    (p) => html`
                      <sl-card class="buyrite-tile">
                        ${p.image
                          ? html`
                              <img
                                slot="image"
                                src="${App.apiBase}/images/${p.image}"
                                alt="${p.title}"
                              />
                            `
                          : ""}

                        <h3 slot="header" class="buyrite-tile-title">
                          ${p.title}
                        </h3>

                        <div class="buyrite-tile-meta">
                          <span class="buyrite-tile-category">
                            ${(p.category || "uncategorised").toUpperCase()}
                          </span>
                          <span class="buyrite-tile-price">
                            $${Number(p.price || 0).toFixed(2)}
                          </span>
                        </div>

                        <p class="buyrite-tile-description">
                          ${(p.description || "").slice(0, 90)}${(p.description ||
                            "").length > 90
                            ? "…"
                            : ""}
                        </p>

                        ${this.renderEthicsBars(p)}
                      </sl-card>
                    `
                  )}
                </div>
              `}
        </section>
      </div>
    `;

    render(template, App.rootEl);
  }
}

export default new buyriteView();
