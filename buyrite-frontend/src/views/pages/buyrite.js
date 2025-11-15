import App from "../../App";
import { html, render } from "lit-html";
import { gotoRoute, anchorRoute } from "../../Router";
import Auth from "../../Auth";
import Utils from "../../Utils";

class HaircutsView {
  init() {
    document.title = "Haircuts";
    this.render();
    Utils.pageIntroAnim();
  }

  render() {
    const buyrite = html`
      <br-app-header
        title="Profile"
        user="${JSON.stringify(Auth.currentUser)}"
      ></br-app-header>
      <div class="page-content">
        <h1>Haircuts</h1>
        <p>Page content ...</p>
      </div>
    `;
    render(buyrite, App.rootEl);
  }
}

export default new HaircutsView();
