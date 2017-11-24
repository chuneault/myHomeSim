/**
 * Created by chune on 2016-10-20.
 */

"use strict";

const plugins = require("../../lib/hsPlugins.js");
let getIP = require('external-ip')();
let schedule = require('node-schedule');

class publicIp extends plugins {

  constructor(controller, params) {

    super(controller, params);

    let self = this;
    let ctrl = self.__controller;


    ctrl.on('loadDBCompleted', function () {
      ctrl.addOrGetNode({name: 'publicIp'}, {name: 'publicIp'}, null,
          function (error, node) {
            if (node) {
              ctrl.addOrUpdateSensor({nodeId: node._id, name: 'ip'}, {nodeId: node._id, name: 'ip'}, node,
                  function (err, sensor) {
                    let checkIp = function () {
                      ctrl.log.info('Checking Inet Pulic IP');
                      getIP(function (err, ip) {
                        ctrl.log.info('Pulic IP is', ip);
                        if (sensor.lastValue != ip) {
                          ctrl.addSensorValue(sensor, ip);
                        }
                      })
                    };
                    checkIp();
                    schedule.scheduleJob('*/5 * * * *', function(){
                      //console.log('The answer to life, the universe, and everything!');
                      checkIp();
                    });
                  });
            }
          });


    });
  }
}

exports.connect = function (pluginType, params, callback) {
  callback({
    name: 'publicIp',
    params: params,
    pluginClass: publicIp
  });
};


