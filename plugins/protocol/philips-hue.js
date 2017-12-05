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
                   self.__controller.addOrUpdateSensor({nodeId: node._id, vendor: {light: {id: light.id}}},
                       {name: light.name, functionType: [self.__controller.sensorFunctionType.switch, self.__controller.sensorFunctionType.brightness],
                           stateOn: light.state.on, stateBrigthness: light.state.bri, vendor: {light}}, node,
                       function(err, sensor) {

                           sensor.__sensorApi = light;
                           sensor.turnOn = function(){
                               self.write(this, 'on', true);
                               self.__controller.addSensorValue(this, true);
                               this.stateOn = true;
                           };
                           sensor.turnOff = function(){
                               self.write(this, 'on', false);
                               self.__controller.addSensorValue(this, false);
                               this.stateOn = false;
                           };
                           sensor.brightness = function(value){
                               self.write(this, 'brightness', value);
                               this.stateBrigthness = value;
                           };
                       });
               });

          }
     );
  }


  write(sensor, msgType, msgVal) {
      var self = this;
      let state = hue.lightState.create();
      state[msgType](msgVal);
      self.api.setLightState(sensor.vendor.light.id, state)
          .then(function(result){})
          .done();
  }

  send(node, sensor, msgType, msgVal) {
    this.write(sensor, msgType, msgVal);
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'philips-hue',
    params: params,
    pluginClass: philipsHueBridge
  });
};


