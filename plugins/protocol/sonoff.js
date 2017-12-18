"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
let unirest = require('unirest');

class sonoff extends plugins {

  constructor(controller, params) {
    super(controller, params);
    let self = this;
    self.log = params.logger.addLogger('sonoff', {fileName: './logs/sonoff.log'});

    controller.addDevice(this);

    controller.on('loadDBCompleted', function(){
        self.log.info('Connecting to Simple Sonoff Server', self.params.serverUrl.bold);
        unirest.get(params.serverUrl + '/devices')
            .end(function (resp) {
                self.log.info(resp.body);
                _.each(resp.body, function(sonoffDevice){
                    self.log.info(sonoffDevice);
                    self.registerSonoffDevice(sonoffDevice);
                });
            });
    });
  };

  registerSonoffDevice(sonoffDevice) {
     let self = this;
     self.__controller.addOrUpdateNode({id: self.params.id},
         {id: self.params.id, name: self.params.name, vendor: self.params}, self,
         function (error, node) {
             if (node)
                   self.__controller.addOrUpdateSensor({nodeId: node._id, id: sonoffDevice.id},
                       {id: sonoffDevice.id, functionType: [self.__controller.sensorFunctionType.switch], vendor: {sonoffDevice},
                           stateOn: sonoffDevice = 'on', }, node,
                       function(err, sensor) {
                           sensor.__sensorUrl = self.params.serverUrl + '/devices/'+ sonoffDevice.id;
                           sensor.turnOn = function(){
                               self.write(this, true);
                               self.__controller.addSensorValue(this, true);
                               this.stateOn = true;
                           };
                           sensor.turnOff = function(){
                               self.write(this,  false);
                               self.__controller.addSensorValue(this, false);
                               this.stateOn = false;
                           };
                       });


          }
     );
  }


  write(sensor, msgType, msgVal) {
      unirest.get(sensor.__sensorUrl + '/' + msgType)
          .end(function (resp) {
          });
  }

  send(node, sensor, msgType, msgVal) {
    this.write(sensor, msgType, msgVal);
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'sonoff',
    params: params,
    pluginClass: sonoff
  });
};


