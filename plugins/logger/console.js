"use strict";

/**
 * Created by chune on 2016-10-11.
 */

var plugins = require("../../lib/hsPlugins.js");

class consoleDebug extends plugins {

  constructor(server, params) {

    super(server, params.model);

    server.on('newDevice', function (newDevice) {
          console.log('New Device'.bold.green, newDevice.model);
        });

    server.on('newNode', function (newNode) {
      console.log('New Node'.bold.green, newNode.model.name, newNode._id);
      console.log(JSON.stringify(newNode.model, null, 2));
    });

    server.on('newSensor', function (newSensor) {
      console.log('New Sensor'.bold.green, newSensor.model.name, newSensor._id);
      console.log(JSON.stringify(newSensor.model, null, 2));
    });

    server.on('updateSensor', function (sensor) {
      console.log('Update Sensor'.bold.green);
      console.log(JSON.stringify(sensor.model, null, 2));
    });

    server.on('newSensorValue', function (sensor, value) {
      var node = server.getNode(sensor.model._nodeId);
      console.log('New Value for Node:'.bold.green, node.model.name, 'Sensor:', sensor.model.desc,  sensor.model.name, ':', value);
      console.log(JSON.stringify(sensor.model, null, 2));
    });

    server.on('updateNode', function (node) {
      console.log('Update Node'.bold.green);
      console.log(JSON.stringify(node.model, null, 2));
    });
  }
};


exports.connect = function(pluginType, params, callback) {
  //console.log('I belong to ' + pluginType);
  callback({
    name: 'ConsoleLogger',
    params: params,
    pluginClass: consoleDebug
  });
};
