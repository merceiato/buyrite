import App from "./App";
import Auth from "./Auth";
import Toast from "./Toast";

class ProductAPI {
  get authHeader() {
    return {
      Authorization: `Bearer ${localStorage.accessToken}`,
    };
  }

  async getvendorManageListings() {
    const response = await fetch(`${App.apiBase}/product/vendor`, {
      method: "GET",
      headers: this.authHeader,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      if (err) console.error(err);
      throw new Error("Problem fetching vendor listings");
    }

    return await response.json();
  }

  async createListing(formData) {
    const response = await fetch(`${App.apiBase}/product`, {
      method: "POST",
      headers: this.authHeader,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      if (err) console.error(err);
      throw new Error("Problem creating listing");
    }

    return await response.json();
  }

  async updateListing(id, formData) {
    const response = await fetch(`${App.apiBase}/product/${id}`, {
      method: "PUT",
      headers: this.authHeader,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      if (err) console.error(err);
      throw new Error("Problem updating listing");
    }

    return await response.json();
  }

  async deleteListing(id) {
    const response = await fetch(`${App.apiBase}/product/${id}`, {
      method: "DELETE",
      headers: this.authHeader,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      if (err) console.error(err);
      throw new Error("Problem deleting listing");
    }

    return await response.json();
  }
}

export default new ProductAPI();
