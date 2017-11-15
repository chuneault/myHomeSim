"use strict";

const plugins = require("../../lib/hsPlugins.js");
const { Client } = require('tplink-smarthome-api');
const client = new Client();
const _       = require('lodash');

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
                  console.log('Find Device', deviceInfo.deviceId);
                  self.__controller.addOrUpdateNode({id: '123456'},
                      {name: deviceInfo.dev_name}, self,
                      function (error, node) {
                        if (node)
                          self.__controller.addOrUpdateSensor({_nodeId: node._id, id: deviceInfo.hwId}, deviceInfo, node);
                      }
                  );
              });
          //device.setPowerState(true);
      });
  }

  send(node, sensor, msgType, msgVal) {
      let self = this;
      console.log('Send Message To Node', msgType, msgVal);
      sensor[msgType](msgVal);
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'kasa-tplink',
    params: params,
    pluginClass: kasaTplink
  });
};


