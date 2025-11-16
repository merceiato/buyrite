// src/views/pages/questionnaire.js
import App from "./../../App";
import { html, render } from "lit-html";
import { gotoRoute } from "./../../Router";
import Auth from "./../../Auth";
import Utils from "./../../Utils";
import UserAPI from "./../../UserAPI";
import Toast from "./../../Toast";

class QuestionnaireView {
  constructor() {
    // default “neutral” values (1–5 scale)
    this.values = {
      animalWelfare: 3,
      humanitarian: 3,
      sustainability: 3,
      environmentalism: 3
    };
    this.isSaving = false;
  }

  async init() {
    console.log("QuestionnaireView.init");
    document.title = "Your Values";

    // must be signed in
    if (!Auth.currentUser) {
      gotoRoute("/signin");
      return;
    }

    // vendors (accessLevel 2) should not see the shopper questionnaire
    const level = Number(Auth.currentUser.accessLevel);
    if (level === 2) {
      gotoRoute("/vendor");
      return;
    }

    this.render();
    Utils.pageIntroAnim();
  }

  // ---------- event handlers ----------

  handleRangeChange(key, e) {
    const raw = e.target?.value ?? e.detail?.value;
    const value = Number(raw);

    this.values = {
      ...this.values,
      [key]: Number.isFinite(value) ? value : 3
    };

    // Mostly for any live summary; sliders visually update themselves
    this.render();
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!Auth.currentUser) {
      gotoRoute("/signin");
      return;
    }

    this.isSaving = true;
    this.render();

    try {
      const payload = {
        ethicalPreferences: {
          animalWelfare: this.values.animalWelfare,
          humanitarian: this.values.humanitarian,
          sustainability: this.values.sustainability,
          environmentalism: this.values.environmentalism
        },
        questionnaireCompleted: true
      };

      const updatedUser = await UserAPI.updateUser(
        Auth.currentUser._id,
        payload,
        "json"
      );

      // keep local Auth.currentUser in sync with what the server now has
      Auth.currentUser = updatedUser;
      Toast.show(
        "Preferences saved – we’ll use these to help match products to your values.",
        "success"
      );

      // You can keep them here, or send them to BuyRight:
      // gotoRoute("/buyrite");
    } catch (err) {
      console.error(err);
      Toast.show(
        err.message || "Problem saving preferences",
        "error"
      );
      this.isSaving = false;
      this.render();
    }
  }

  // ---------- render helpers ----------

  renderSliderGroup(label, description, key, value) {
    return html`
      <section class="question-block">
        <header class="question-header">
          <h2>${label}</h2>
          <p>${description}</p>
        </header>

        <sl-range
          min="1"
          max="5"
          step="1"
          value=${value}
          @sl-change=${(e) => this.handleRangeChange(key, e)}
        ></sl-range>

        <div class="range-labels">
          <span>Not important</span>
          <span>Neutral</span>
          <span>Very important</span>
        </div>
      </section>
    `;
  }

  render() {
    const {
      animalWelfare,
      humanitarian,
      sustainability,
      environmentalism
    } = this.values;

    const template = html`
      <br-app-header
        title="Tell us your values"
        user="${JSON.stringify(Auth.currentUser)}"
      ></br-app-header>

      <div class="page-content questionnaire-layout">
        <section class="questionnaire-intro">
          <h1>Help us tailor BuyRight to you</h1>
          <p>
            Use the sliders below to tell us how important each ethical area is.
            We’ll store these on your profile and use them as we build out the
            matching logic in the Buy Right view.
          </p>
        </section>

        <form
          class="questionnaire-form"
          @submit=${this.handleSubmit.bind(this)}
        >
          ${this.renderSliderGroup(
            "Animal welfare",
            "Humane treatment of animals across sourcing, testing, and production.",
            "animalWelfare",
            animalWelfare
          )}

          ${this.renderSliderGroup(
            "Humanitarian impact",
            "Worker rights, fair pay, safe conditions, and overall human impact.",
            "humanitarian",
            humanitarian
          )}

          ${this.renderSliderGroup(
            "Sustainability",
            "Resource use, waste reduction, circularity, and long-term sustainability.",
            "sustainability",
            sustainability
          )}

          ${this.renderSliderGroup(
            "Environmentalism",
            "Carbon footprint, pollution, biodiversity, and ecosystem impact.",
            "environmentalism",
            environmentalism
          )}

          <div class="questionnaire-actions">
            <sl-button
              type="primary"
              size="large"
              ?loading=${this.isSaving}
              submit
            >
              Save my preferences
            </sl-button>
          </div>
        </form>
      </div>
    `;

    render(template, App.rootEl);
  }
}

export default new QuestionnaireView();
