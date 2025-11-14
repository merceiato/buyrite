import App from "./App";
import Auth from "./Auth";
import Toast from "./Toast";

class UserAPI {
  async getUser(userId) {
    if (!userId) return;

    const response = await fetch(`${App.apiBase}/user/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      if (err) console.log(err);
      throw new Error("Problem fetching user");
    }

    const data = await response.json();
    return data;
  }

  async updateUser(userId, userData, dataType = "form") {
    if (!userId || !userData) return;

    let responseHeader;

    if (dataType == "form") {
      responseHeader = {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.accessToken}` },
        body: userData,
      };

    } else if (dataType == "json") {
      responseHeader = {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      };
    }

    const response = await fetch(
      `${App.apiBase}/user/${userId}`,
      responseHeader
    );

    if (!response.ok) {
      const err = await response.json();
      if (err) console.log(err);
      throw new Error("Problem updating user");
    }

    const data = await response.json();
    return data;
  }
}

export default new UserAPI();
