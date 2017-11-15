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
     self.__controller.addOrUpdateNode({_deviceId: self._id, id: self.params.id},
         self.params, self,
         function (error, node) {
             if (node)
               _.forEach(lights.lights, function(light) {
                   console.log('update light', light);
                   self.__controller.addOrUpdateSensor({_nodeId: node._id, id: light.id}, light, node);
               });

          }
     );
  }

  send(node, sensor, msgType, msgVal) {
    var self = this;
    var sendMessage = function(){
      let msg = self.__msgToSendQueue[0];
      console.log('Send Message To Node', msg );
      let state = hue.lightState.create();
      state[msg.msgType](msg.msgVal);
      self.api.setLightState(sensor.id, state)
            .then(function(result){ console.log(result);})
            .done();
      if (self.__msgToSendQueue.length > 0) {
         setTimeout(function(){
           self.__msgToSendQueue.shift();
           if (self.__msgToSendQueue.length > 0)
             sendMessage();
         }, 1000);
      }
    };

    this.__msgToSendQueue.push({msgType: msgType, msgVal: msgVal});
    if (this.__msgToSendQueue.length <= 1)
      sendMessage();
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'philips-hue',
    params: params,
    pluginClass: philipsHueBridge
  });
};


