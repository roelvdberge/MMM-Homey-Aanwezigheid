/* MagicMirror Module: MMM-Homey-Aanwezigheid */

Module.register("MMM-Homey-Aanwezigheid", {
  defaults: {
    homeyBaseUrl: "http://homey.local",
    apiKey: "",
    logicEndpoint: "/api/manager/logic/variable",
    pollInterval: 30000,
    presentColor: "#2ecc71",
    absentColor: "#8e8e8e",
    showLabels: true,
    labelPosition: "below",
    debug: false,
    people: []
  },

  getStyles: function () {
    return ["MMM-Homey-Aanwezigheid.css", "font-awesome.css"];
  },

  start: function () {
    this.stateByVariable = {};
    this.loaded = false;
    this.lastError = null;
    this.sendSocketNotification("CONFIG", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "PRESENCE_UPDATE") {
      this.stateByVariable = payload || {};
      this.loaded = true;
      this.lastError = null;
      this.updateDom();
    }
    if (notification === "PRESENCE_ERROR") {
      this.loaded = true;
      this.lastError = payload || { message: "Unknown error" };
      if (this.config.debug) {
        console.log("[MMM-Homey-Aanwezigheid] error", this.lastError);
      }
      this.updateDom();
    }
  },

  getDom: function () {
    var wrapper = document.createElement("div");
    wrapper.className = "mmm-homey-presence";

    if (!this.loaded) {
      wrapper.innerText = "Presence: loading...";
      return wrapper;
    }

    if (this.lastError) {
      wrapper.innerText = "Presence: error (check logs)";
      return wrapper;
    }

    if (!this.config.people || this.config.people.length === 0) {
      wrapper.innerText = "No people configured.";
      return wrapper;
    }

    var grid = document.createElement("div");
    grid.className = "mmm-homey-grid";

    var presentColor = this.config.presentColor;
    var absentColor = this.config.absentColor;

    this.config.people.forEach((person) => {
      var item = document.createElement("div");
      item.className = "mmm-homey-item";

      var icon = document.createElement("i");
      icon.className = person.icon || "fa-solid fa-user";

      var rawValue = this.stateByVariable[person.variable];
      var isPresent = this.isPresentValue(rawValue);
      icon.style.color = isPresent ? presentColor : absentColor;

      item.appendChild(icon);

      if (this.config.showLabels) {
        var label = document.createElement("div");
        label.className = "mmm-homey-label";
        label.innerText = person.name || person.variable;
        item.appendChild(label);
      }

      if (this.config.labelPosition === "right") {
        item.classList.add("label-right");
      }

      grid.appendChild(item);
    });

    wrapper.appendChild(grid);
    return wrapper;
  },

  isPresentValue: function (value) {
    if (value === true) return true;
    if (value === false) return false;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      var normalized = value.trim().toLowerCase();
      return normalized === "ja" || normalized === "yes" || normalized === "true" || normalized === "1";
    }
    return false;
  }
});
