"use strict";

const plugins = require("../../lib/hsPlugins.js");
const hueApi  = require("node-hue-api").HueApi;
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
     console.log('registerLights', lights);
     let self = this;
     _.forEach(lights.lights, function(light) {
         console.log('update or add light', light);
         self.__controller.addOrUpdateNode({_deviceId: self._id, id: light.id},
             light, self);
     });
  }

  send(node, sensor, subType, msgVal) {
    /*var self = this;
    var sendMessage = function(){
      let msg = self.__msgToSendQueue[0].toString();
      console.log('Send Message To Node', msg );
      self.__client.write(msg);
      if (self.__msgToSendQueue.length > 0) {
         setTimeout(function(){
           self.__msgToSendQueue.shift();
           if (self.__msgToSendQueue.length > 0)
             sendMessage();
         }, 1000);
      }
    };

    this.__msgToSendQueue.push(new this.__mySensor.message({
      nodeId: node.id,
      childSensorId: sensor.id,
      messageType: this.__mySensor.protocol.messageType.set,
      ack: 0,
      subType: subType,
      payLoad: msgVal
    }));

    if (this.__msgToSendQueue.length <= 1)
      sendMessage();*/
  }


}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'philips-hue',
    params: params,
    pluginClass: philipsHueBridge
  });
};


