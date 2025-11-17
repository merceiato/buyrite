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

    // quick-fire yes/no questions
    // each question maps to one ethical key and has a weight
    this.questions = [
      {
        key: "animalWelfare",
        text: "I avoid brands that test their products on animals whenever possible.",
        weight: 1
      },
      {
        key: "animalWelfare",
        text: "I would pay more for products that guarantee humane treatment of animals.",
        weight: 1
      },
      {
        key: "humanitarian",
        text: "I care if workers in the supply chain are paid fairly and work in safe conditions.",
        weight: 1
      },
      {
        key: "humanitarian",
        text: "I try to avoid brands that have been exposed for poor labour practices.",
        weight: 1
      },
      {
        key: "sustainability",
        text: "I prefer products that are designed to last or be repaired instead of thrown away.",
        weight: 1
      },
      {
        key: "sustainability",
        text: "I notice how much packaging a product uses when I buy it.",
        weight: 1
      },
      {
        key: "environmentalism",
        text: "I actively look for brands that reduce their carbon footprint or emissions.",
        weight: 1
      },
      {
        key: "environmentalism",
        text: "I avoid products that are known to damage ecosystems or biodiversity.",
        weight: 1
      }
    ];
    this.currentQuestionIndex = 0;
    this.questionsCompleted = false;
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

    // if the user already has saved preferences, start from those instead of neutral
    const prefs = Auth.currentUser.ethicalPreferences || {};
    this.values = {
      animalWelfare:
        Number(prefs.animalWelfare) && Number.isFinite(Number(prefs.animalWelfare))
          ? Number(prefs.animalWelfare)
          : 3,
      humanitarian:
        Number(prefs.humanitarian) && Number.isFinite(Number(prefs.humanitarian))
          ? Number(prefs.humanitarian)
          : 3,
      sustainability:
        Number(prefs.sustainability) && Number.isFinite(Number(prefs.sustainability))
          ? Number(prefs.sustainability)
          : 3,
      environmentalism:
        Number(prefs.environmentalism) && Number.isFinite(Number(prefs.environmentalism))
          ? Number(prefs.environmentalism)
          : 3
    };

    this.render();
    Utils.pageIntroAnim();
  }

  // ---------- quick-fire question logic ----------

  handleQuestionAnswer(answerYes) {
    if (this.questionsCompleted) return;

    const q = this.questions[this.currentQuestionIndex];
    if (q) {
      const current = Number(this.values[q.key]) || 3;

      // yes = increase importance, no = slightly decrease
      const delta = answerYes ? q.weight : -q.weight;
      const next = Math.max(1, Math.min(5, current + delta));

      this.values = {
        ...this.values,
        [q.key]: next
      };
    }

    const nextIndex = this.currentQuestionIndex + 1;
    if (nextIndex >= this.questions.length) {
      this.questionsCompleted = true;
    } else {
      this.currentQuestionIndex = nextIndex;
    }

    // re-render so:
    // - next question shows
    // - sliders reflect updated values
    this.render();
  }

  renderQuickfireBlock() {
    if (this.questionsCompleted) {
      return html`
        <section class="questionnaire-quickfire">
          <h2>Quick-fire questions complete</h2>
          <p>
            You’ve answered all the yes/no questions. You can fine-tune your
            values using the sliders below before saving.
          </p>
        </section>
      `;
    }

    const q = this.questions[this.currentQuestionIndex];
    if (!q) return html``;

    const index = this.currentQuestionIndex + 1;
    const total = this.questions.length;

    const categoryLabels = {
      animalWelfare: "Animal welfare",
      humanitarian: "Humanitarian impact",
      sustainability: "Sustainability",
      environmentalism: "Environmentalism"
    };

    return html`
      <section class="questionnaire-quickfire">
        <h2>Quick-fire values check</h2>
        <p class="questionnaire-quickfire-sub">
          Answer a few yes/no questions to help us set your starting values.
        </p>

        <div class="quickfire-status">
          <span>Question ${index} of ${total}</span>
          <span>${categoryLabels[q.key] || ""}</span>
        </div>

        <p class="quickfire-question-text">
          ${q.text}
        </p>

        <div class="quickfire-actions">
          <sl-button
            type="primary"
            @click=${() => this.handleQuestionAnswer(true)}
          >
            Yes
          </sl-button>
          <sl-button
            type="default"
            @click=${() => this.handleQuestionAnswer(false)}
          >
            No
          </sl-button>
        </div>
      </section>
    `;
  }

  // ---------- slider event handlers ----------

  handleRangeChange(key, e) {
    const raw = e.target?.value ?? e.detail?.value;
    const value = Number(raw);

    this.values = {
      ...this.values,
      [key]: Number.isFinite(value) ? value : 3
    };

    this.render();
  }

  async handleSubmit(e) {
    // sl-submit event from <sl-form>
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Questionnaire handleSubmit()", this.values);

    if (!Auth.currentUser) {
      gotoRoute("/signin");
      return;
    }

    if (this.isSaving) return; // avoid double-submit

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

      console.log("Questionnaire payload:", payload);

      const updatedUser = await UserAPI.updateUser(
        Auth.currentUser._id,
        payload,
        "json"
      );

      // keep local Auth.currentUser in sync with what the server now has
      Auth.currentUser = updatedUser;
      this.isSaving = false;

      Toast.show(
        "Preferences saved – we’ll use these to help match products to your values.",
        "success"
      );

      this.render();
    } catch (err) {
      console.error("Questionnaire save error:", err);
      Toast.show(err.message || "Problem saving preferences", "error");
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
            Start with a few quick yes/no questions, then fine-tune your values
            using the sliders. We’ll store these on your profile and use them in
            the Buy Right view to match products to what matters most to you.
          </p>
        </section>

        ${this.renderQuickfireBlock()}

        <sl-form
          class="questionnaire-form"
          @sl-submit=${this.handleSubmit.bind(this)}
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
              class="submit-btn"
              type="primary"
              size="large"
              submit
              ?loading=${this.isSaving}
            >
              Save my preferences
            </sl-button>
          </div>
        </sl-form>
      </div>
    `;

    render(template, App.rootEl);
  }
}

export default new QuestionnaireView();
