/* MagicMirror Module: MMM-Homey-Aanwezigheid - Node Helper */

const NodeHelper = require("node_helper");
const http = require("http");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    this.config = null;
    this.pollTimer = null;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      this.scheduleFetch(0);
    }
  },

  scheduleFetch: function (delayMs) {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = setTimeout(() => {
      this.fetchPresence();
    }, delayMs);
  },

  fetchPresence: function () {
    if (!this.config || !this.config.apiKey) {
      this.sendSocketNotification("PRESENCE_UPDATE", {});
      this.scheduleFetch(this.config ? this.config.pollInterval : 30000);
      return;
    }

    const baseUrl = this.config.homeyBaseUrl || "http://homey.local";
    const endpoint = this.config.logicEndpoint || "/api/manager/logic/variable";
    const url = new URL(endpoint, baseUrl);
    const client = url.protocol === "https:" ? https : http;

    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        Accept: "application/json"
      }
    };

    const req = client.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          this.sendSocketNotification("PRESENCE_UPDATE", {});
          this.scheduleFetch(this.config.pollInterval);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const variables = this.extractVariables(parsed);
          this.sendSocketNotification("PRESENCE_UPDATE", variables);
        } catch (error) {
          this.sendSocketNotification("PRESENCE_UPDATE", {});
        }

        this.scheduleFetch(this.config.pollInterval);
      });
    });

    req.on("error", () => {
      this.sendSocketNotification("PRESENCE_UPDATE", {});
      this.scheduleFetch(this.config.pollInterval);
    });

    req.end();
  },

  extractVariables: function (payload) {
    const items = payload && payload.result ? payload.result : payload;
    if (!items || !Array.isArray(items)) {
      return {};
    }

    const map = {};
    items.forEach((item) => {
      if (item && item.name) {
        map[item.name] = item.value;
      }
    });

    return map;
  }
});
