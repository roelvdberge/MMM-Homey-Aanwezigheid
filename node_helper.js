/* MagicMirror Module: MMM-Homey-Aanwezigheid - Node Helper */

const NodeHelper = require("node_helper");
const http = require("http");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    this.config = null;
    this.pollTimer = null;
    this.lastLogAt = 0;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      this.log("config received", {
        homeyBaseUrl: this.config.homeyBaseUrl,
        logicEndpoint: this.config.logicEndpoint,
        pollInterval: this.config.pollInterval
      });
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
      this.log("missing apiKey in config");
      this.sendSocketNotification("PRESENCE_ERROR", { message: "Missing apiKey in config" });
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
          this.log("http error", { statusCode: res.statusCode, body: data });
          this.sendSocketNotification("PRESENCE_ERROR", {
            message: "HTTP error",
            statusCode: res.statusCode
          });
          this.sendSocketNotification("PRESENCE_UPDATE", {});
          this.scheduleFetch(this.config.pollInterval);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const variables = this.extractVariables(parsed);
          this.log("presence updated", { count: Object.keys(variables).length });
          this.sendSocketNotification("PRESENCE_UPDATE", variables);
        } catch (error) {
          this.log("json parse error", { message: error.message });
          this.sendSocketNotification("PRESENCE_ERROR", { message: "JSON parse error" });
          this.sendSocketNotification("PRESENCE_UPDATE", {});
        }

        this.scheduleFetch(this.config.pollInterval);
      });
    });

    req.on("error", (error) => {
      this.log("request error", { message: error.message });
      this.sendSocketNotification("PRESENCE_ERROR", { message: "Request error" });
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
  },

  log: function (message, details) {
    if (!this.config || !this.config.debug) return;
    const now = Date.now();
    if (now - this.lastLogAt < 1000) return;
    this.lastLogAt = now;
    if (details) {
      console.log(`[MMM-Homey-Aanwezigheid] ${message}`, details);
    } else {
      console.log(`[MMM-Homey-Aanwezigheid] ${message}`);
    }
  }
});
