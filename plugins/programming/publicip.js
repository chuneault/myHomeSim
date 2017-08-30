/**
 * Created by chune on 2016-10-20.
 */

"use strict";


const _ = require('lodash');
const plugins = require("../../lib/hsPlugins.js");
var getIP = require('external-ip')();

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
                    var checkIp = function () {
                      getIP(function (err, ip) {
                        if (sensor.lastValue != ip) {
                          ctrl.addSensorValue(sensor, ip);
                        }
                      })
                    };
                    checkIp();
                    setInterval(function () {
                      checkIp();
                    }, 60000);
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


