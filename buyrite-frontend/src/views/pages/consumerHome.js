// Consumer home view – main product browsing page for shoppers.
import App from "../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "../../Router";
import Auth from "../../Auth";
import Utils from "../../Utils";
import Toast from "../../Toast";
import ProductAPI from "../../ProductAPI";

class consumerHomeView {
  constructor() {
    this.products = [];
    this.searchTerm = "";
    this.selectedCategory = "all";
    this.ethicsStrict = false; // when true: only show products that match my ethics
    this.isLoading = false;
    this.error = null;
  }

  async init() {
    console.log("consumerHomeView.init");
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

  // turn "match my ethics" filter on
  handleEthicsYes() {
    this.ethicsStrict = true;
    this.render();
  }

  // turn "match my ethics" filter off
  handleEthicsNo() {
    this.ethicsStrict = false;
    this.render();
  }

  // ----------------------------------------
  // ethics matching: within 1 point per rating
  // ----------------------------------------
  withinOnePoint(userPrefs, productRatings) {
    if (!userPrefs || !productRatings) return false;

    const up = userPrefs;

    const diffsOk =
      Math.abs(Number(productRatings.animalWelfare) - Number(up.animalWelfare)) <= 1 &&
      Math.abs(Number(productRatings.humanitarian) - Number(up.humanitarian)) <= 1 &&
      Math.abs(Number(productRatings.sustainability) - Number(up.sustainability)) <= 1 &&
      Math.abs(Number(productRatings.environmentalism) - Number(up.environmentalism)) <= 1;

    return diffsOk;
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

      // user-specific ethics filter:
      // when on, only keep products where each rating is within 1 point
      // of the current user's ethicalPreferences set in the questionnaire
      if (this.ethicsStrict) {
        const prefs = Auth.currentUser && Auth.currentUser.ethicalPreferences;
        const er = p.ethicalRatings || {};

        if (!this.withinOnePoint(prefs, er)) {
          return false;
        }
      }

      return true;
    });
  }

  // rendering helpers -----------------------

  renderEthicsBars(p) {
    const er = p.ethicalRatings || {};

    const toPct = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      const pct = (n / 5) * 100;
      return Math.max(0, Math.min(100, pct)); // clamp 0–100
    };

    const safeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : "–";
    };

    const ethicRow = (label, value, key) => html`
      <div class="buyrite-ethic-row">
        <span class="buyrite-ethic-label">
          ${label} (${safeNum(value)}/5)
        </span>
        <div class="buyrite-ethic-bar">
          <div
            class="buyrite-ethic-bar-fill"
            style="width: ${toPct(value)}%;"
            aria-label="${label}"
            role="img"
          ></div>
        </div>
      </div>
    `;

    return html`
      <div class="buyrite-tile-ethics">
        ${ethicRow("Animal welfare", er.animalWelfare, "animalWelfare")}
        ${ethicRow("Humanitarian", er.humanitarian, "humanitarian")}
        ${ethicRow("Sustainability", er.sustainability, "sustainability")}
        ${ethicRow("Environmentalism", er.environmentalism, "environmentalism")}
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

        <!-- Ethics toggle: match my preferences on/off -->
        <section class="buyrite-ethics-question">
          <p class="buyrite-ethics-question__text">
            Only show products that match my ethical preferences (within 1 point)?
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
                        Tip: try turning off the "match my ethics" filter or
                        broadening your search.
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

export default new consumerHomeView();
