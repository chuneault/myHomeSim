"use strict";

const plugins = require("../../lib/hsPlugins.js");
const hue  = require("node-hue-api");
const hueApi = hue.HueApi;
const _       = require('lodash');

class philipsHueBridge extends plugins {

  constructor(controller, params) {
    super(controller, params);
    let self = this;
    self.log = params.logger.addLogger('philipsHue', {fileName: './logs/philipsHue.log'});

    controller.addDevice(this);

    controller.on('loadDBCompleted', function(){
      /*controller.checkNodeHeartBeat();*/
        self.log.info('Connecting to Philips Hue Bridge', self.params.host.bold);
        self.api = new hueApi(self.params.host, self.params.userName);
        self.api.lights(function(err, lights) {
            if (err) throw err;
            self.registerLights(lights);
        });
    });
  };

  registerLights(lights) {
     let self = this;
     self.__controller.addOrUpdateNode({id: self.params.id},
         {id: self.params.id, name: self.params.name, vendor: self.params}, self,
         function (error, node) {
             if (node)
               _.forEach(lights.lights, function(light) {
                   self.__controller.addOrUpdateSensor({nodeId: node._id, vendor: {light: {id: light.id}}}, {name: light.name, vendor: {light}}, node);
               });

          }
     );
  }

  send(node, sensor, msgType, msgVal) {
    var self = this;
    console.log('Send Message To Node', msgType, msgVal );
    let state = hue.lightState.create();
    state[msgType](msgVal);
    self.api.setLightState(sensor.id, state)
        .then(function(result){ console.log(result);})
        .done();
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'philips-hue',
    params: params,
    pluginClass: philipsHueBridge
  });
};


