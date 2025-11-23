// src/views/pages/about.js
import App from "./../../App";
import { html, render } from "lit-html";
import Auth from "./../../Auth";
import Utils from "./../../Utils";

class AboutView {
  init() {
    document.title = "About & Support";
    this.render();
    Utils.pageIntroAnim();
  }

  render() {
    const userJson = Auth.currentUser
      ? JSON.stringify(Auth.currentUser)
      : null;

    const template = html`
      <br-app-header
        title="About & Support"
        user="${userJson}"
      ></br-app-header>

      <div class="page-content about-layout">

        <!-- ABOUT / ECC PANEL -->
        <section class="about-panel">
          <h3>About BuyRight</h3>
          <p>
            BuyRight is an ethical shopping platform developed for the
            <strong>Ethical Commerce Collective (ECC)</strong>, a not-for-profit
            organisation that helps people make informed, values-aligned
            purchasing decisions.
          </p>
          <p>
            The platform brings together consumers and vendors who care about
            <strong>sustainability</strong>, <strong>fair labour</strong>,
            <strong>animal welfare</strong> and <strong>transparent sourcing</strong>.
            Products on BuyRight are tagged with their ethical attributes so you
            can quickly see how each item aligns to your values.
          </p>

          <h4>Our mission</h4>
          <ul class="about-list">
            <li>Empower conscious consumers to shop with confidence.</li>
            <li>Support ethical businesses with a dedicated, relevant audience.</li>
            <li>Cut through greenwashing with clear, honest information.</li>
          </ul>

          <h4>Featured ethical suppliers</h4>
          <p class="about-suppliers-intro">
            BuyRight can feature a range of suppliers such as:
          </p>
          <ul class="about-list">
            <li><strong>Caring Coffee</strong> – fair trade, small-batch coffee.</li>
            <li><strong>Fair Trade Spices</strong> – ethically sourced pantry staples.</li>
            <li><strong>Everyday Earth</strong> – low-waste household essentials.</li>
          </ul>
        </section>

        <!-- SUPPORT / FAQ PANEL -->
        <section class="support-panel">
          <h3>Support & FAQs</h3>

          <sl-details summary="How are ethical ratings decided?">
            <p>
              Vendors provide information about their sourcing, certifications
              and production practices when creating a product listing.
              Over time, this can be supported by third-party certifications
              and community feedback to improve accuracy and transparency.
            </p>
          </sl-details>

          <sl-details summary="What do the ethical categories mean?">
            <p>
              Ethical tags such as <em>Fair Labour</em>, <em>Low Carbon</em>,
              <em>Vegan</em> or <em>Cruelty-Free</em> are used to describe how
              a product aligns with common values. These tags are shown clearly
              on product cards and detail pages so you can quickly compare items.
            </p>
          </sl-details>

          <sl-details summary="I’m a vendor – how do I get support?">
            <p>
              Log in with your vendor account and use the
              <strong>Manage Listings</strong> and <strong>Preview Products</strong>
              pages to keep your catalogue up to date. If you run into any issues,
              you can reach out to the ECC support team using the contact details below.
            </p>
          </sl-details>

          <h4>Contact</h4>
          <p>
            For general questions or technical support, please contact:
          </p>
          <p class="support-contact">
            Email:
            <a href="mailto:support@ecc-buyright.org">
              support@ecc-buyright.org
            </a>
          </p>
        </section>

      </div>
    `;

    render(template, App.rootEl);
  }
}

export default new AboutView();
