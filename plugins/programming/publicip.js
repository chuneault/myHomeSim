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
              ctrl.addOrUpdateSensor({_nodeId: node._id, name: 'ip'}, {name: 'ip'}, node,
                  function (err, sensor) {
                    let checkIp = function () {
                      console.log('checking inet ip');
                      getIP(function (err, ip) {
                        console.log('ip is: ', ip);
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


