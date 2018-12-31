"use strict";

const plugins = require("../../lib/hsPlugins.js");
const { Client } = require('tplink-smarthome-api');
const client = new Client();
const _       = require('lodash');
const assert = require('assert');

class kasaTplink extends plugins {

  constructor(controller, params) {
    super(controller, params);
    let self = this;
    self.log = params.logger.addLogger('kasatplink', {fileName: './logs/kasatplink.log'});

    controller.addDevice(this);

    controller.on('loadDBCompleted', function(){
        //controller.checkNodeHeartBeat();
        self.findDevices();
    });
  };

  findDevices() {
     let self = this;
     self.log.info('Discovering TP_LINK Devices');
     client.startDiscovery({discoveryTimeout: 15000}).on('device-new', (device) => {
          device.getSysInfo().then(
              function (deviceInfo) {

                  self.__controller.addOrUpdateNode({id: deviceInfo.deviceId},
                      {id: deviceInfo.deviceId, name: deviceInfo.dev_name}, self,
                      function (error, node) {
                        assert.equal(error, null);
                        if (node) {
                            node.__deviceApi = device;
                            self.__controller
                                .addOrUpdateSensor({id: deviceInfo.deviceId},
                                    {id: deviceInfo.deviceId, name: deviceInfo.alias, stateOn: deviceInfo.relay_state == 1,
                                        functionType: [self.__controller.sensorFunctionType.switch],
                                        vendor: deviceInfo}, node,
                                      function(err, sensor) {
                                        assert.equal(err, null);


                                        sensor.turnOn = function(){
                                            this.__ownerNode.__deviceApi.setPowerState(true).then();
                                        };
                                        sensor.turnOff = function(){
                                            this.__ownerNode.__deviceApi.setPowerState(false).then();
                                        };

                                         self.log.info('new TPLink Sensor found', sensor._id);

                                        device.__sensor = sensor;

                                        device.startPolling(10000);
                                        device.on('power-update', function(newSate) {
                                            if (device.__sensor.lastValue != newSate) {
                                               device.__sensor.stateOn = newSate
                                               self.__controller.addSensorValue(device.__sensor, newSate);
                                              //console.log('power-update', newSate, this );
                                            }
                                        });

                                      });
                        }
                      }
                  );
              });
          //device.setPowerState(true);
      });

      setTimeout(function(){self.ready();}, 20000);

  }

  send(node, sensor, msgType, msgVal) {
      let self = this;
      console.log('Send Message To Node', msgType, msgVal);
      if (msgVal == 'false')
          msgVal =  false;
      if (msgVal == 'true')
          msgVal =  true;
      node.__deviceApi[msgType](msgVal).then(console.log).catch(function(e) {
          console.log('error kasa tp-link', e); // "zut !"
      })

  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'kasa-tplink',
    params: params,
    pluginClass: kasaTplink
  });
};


