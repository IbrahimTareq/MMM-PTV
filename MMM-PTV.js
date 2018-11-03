'use strict';

Module.register("MMM-PTV", {

  result: {},
  defaults: {
    showBefore: null,
    updateInterval: 60000,
    station: "",
    noDisruptions: false
  },

  getStyles: function() {
    return ["MMM-PTV.css"];
  },

  start: function() {
    this.getDisruptions();
  },

  getDom: function() {
    var wrapper = document.createElement("div");

    var table = document.createElement("table");
    table.className = 'small';

    var header_row = document.createElement("tr");
    table.appendChild(header_row);

    var header = document.createElement("header");
    header.innerHTML = "PTV Delays -" + this.config.station;
    header_row.appendChild(header);

    if (this.config.noDisruptions == true) {
	    var row = document.createElement("tr");
	    table.appendChild(row);

	    var disruption = document.createElement("td");
	    disruption.innerHTML = "No disruptions announced";
	    disruption.className = 'light small';
   	    row.appendChild(disruption);
	    return table;
    }

    var data = this.result;

    for (var x=0; x<data.length; x++){
	    var row = document.createElement("tr");
	    table.appendChild(row);

	    var disruption = document.createElement("td");
	    disruption.innerHTML = data[x];
	    disruption.className = 'light small';
	    row.appendChild(disruption);
    }


    return table;
  },

  getDisruptions: function () {
    var route_id = 1823;
    // This will send notification called GET_DISRUPTIONS to node_helper
    this.sendSocketNotification('GET_DISRUPTIONS', route_id);
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "DISRUPTIONS_RESULT") {
      var self = this;
      this.result = payload;
      this.updateDom(self.config.fadeSpeed);
    }

    if (notification === "NO_DISRUPTIONS") {
      var self = this;
      this.result = payload;
      this.config.noDisruptions = true;
      this.updateDom(self.config.fadeSpeed);
    }

    if (notification === "STATION_NAME") {
      var self = this;
      this.config.station = payload;
    }
  },

});
