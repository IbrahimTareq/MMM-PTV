var NodeHelper = require('node_helper');
var crypto = require('crypto');
var request = require('request');

var devid = "3000396";
var key = "af6d1ce2-1272-4717-a212-c83902190af7";
var baseurl = "https://timetableapi.ptv.vic.gov.au";

const TRANSPORT_TYPE = {
  train: 0,
  tram: 1,
  bus: 2,
  vline: 3,
  night_bus: 4
}
Object.freeze(TRANSPORT_TYPE)

const TRAIN_ROUTES = {
  craigieburn: 3,
  upfield: 15,
  pakenham: 11
}
Object.freeze(TRAIN_ROUTES)

const VLINE_ROUTES = {
  bairnsdale: 1823,
  ballarat: 1762,
  mildura: 1734
}
Object.freeze(VLINE_ROUTES)

const TRAM_ROUTES = {
  north_coburg: 725,
  airport_west: 897,
  west_coburg: 11529
}
Object.freeze(TRAM_ROUTES)

const TYPES = {
  vline: VLINE_ROUTES,
  train: TRAIN_ROUTES,
  tram: TRAM_ROUTES
}
Object.freeze(TYPES)

module.exports = NodeHelper.create({
  start: function () {
    console.log('PTV helper started...');
  },

  setup: function (url, url2hash) {
    var signature = crypto.createHmac('sha1', key).update(url2hash).digest('hex');
    var ucSignature = signature.toUpperCase();
    var str = baseurl + url + "?devid=" + devid + "&signature=" + ucSignature;
    return str;
  },

  getDisruptions: function (route_id) {
      var self = this;
      var type;
      var res;

      var url = "/v3/disruptions/route/" + route_id;
      var url2hash = "/v3/disruptions/route/" + route_id + "?devid=" + devid;

      var str = this.setup(url, url2hash);

      request(str, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          //console.log('body:', body);
          var obj = JSON.parse(body);
          // This code is a bit tricky. It derives whether route_id is for a train or a tram
          for (var x in TYPES){
            var exists = Object.keys(TYPES[x]).some(function(k) {
              // When a match is found, assign the type of the route to the variable type
              if (TYPES[x][k] === route_id){
                type = x;
		self.sendSocketNotification('STATION_NAME', k);
              }
            });
          }

          switch(type) {
            case 'train':
              res = obj.disruptions.metro_train;
              break;
            case 'tram':
              res = obj.disruptions.metro_tram;
              break;
            case 'vline':
              res = obj.disruptions.regional_train;
              break;
            default:
              console.log("UFO spotted, ruuuuun!")
          }

          if (res.length <= 0){
            self.sendSocketNotification('NO_DISRUPTIONS');
          } else {
            var disruptions = [];

            // Add all disruptions to the disruptions array
            for (i=0; i<res.length; i++){
              // We only want to show the first three disruptions so the for loop will break after the third disruption is stored
              if (i > 3){
                break;
              }
              var title = res[i].title;
	            var str = title.split(":").pop();
              disruptions.push(str);
            }

            self.sendSocketNotification('DISRUPTIONS_RESULT', disruptions);
          }
        } else {
          console.log(error);
        }

      });

  },

  socketNotificationReceived: function(notification, payload) {
    // Checks if notification called GET_DISRUPTIONS is received, if so then call getDisruptions() method in this file
    if (notification === 'GET_DISRUPTIONS') {
      this.getDisruptions(payload);
    }
  }

});
