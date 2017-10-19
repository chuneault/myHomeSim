"use strict";

/**
 * Created by chune on 2016-10-12.
 */

/**
 * Created by chune on 2016-10-11.
 */


var _ = require('lodash'),
    path = require('path'),
    PromisifyMe = require('promisify-me'),
    util = require('util');


var serializeObj = function (obj) {
  return _.omitBy(obj, function (val, key) {
    return (_.startsWith(key, '__'));
  });
};

class hsDatabase {

  constructor(controller) {

    var self = this;
    self.controller = controller;
    self.logger = controller.logger;
    var log = self.logger['core'];

    var DataStore = PromisifyMe(require('nedb'), 'nedb');

    log.profile('database');

    this.db = {};

    this.db.plugins = new DataStore('./data/plugins.db');
    this.db.plugins.loadDatabase();

    this.db.nodes = new DataStore('./data/nodes.db');
    this.db.nodes.loadDatabase();

    this.db.sensors = new DataStore('./data/sensors.db');
    this.db.sensors.loadDatabase();

    this.db.sensorsVal = new DataStore('./data/sensorsValues.db');
    this.db.sensorsVal.loadDatabase();

    this.db.plugins.persistence.setAutocompactionInterval(300000);
    this.db.nodes.persistence.setAutocompactionInterval(300000);
    this.db.sensors.persistence.setAutocompactionInterval(300000);

    controller.__db = this.db;

    var plugins = this.db.plugins.find({active: true});
    var nodes = this.db.nodes.find({});
    var sensors = this.db.sensors.find({});

    var deviceListActive = [];

    plugins.exec().then(function (plugins) {
      plugins.forEach(function (plugin) {
        require('plug').create(plugin.type, plugin)
            .on('connect', function (pluginName, pluginData, modulePath) {
              log.info('loaded plugin', pluginName.bold);
              pluginData.params.logger = self.logger;
              new pluginData.pluginClass(self.controller, pluginData.params);
            }).load(path.dirname(process.argv[1]) + util.format('/plugins/%s/%s.js', plugin.type, plugin.name));
      })
    }).done(function () {
      nodes.exec().then(function (nodes) {
        nodes.forEach(function (node) {
          self.controller.addNode(node, self.controller.devices[node._deviceId], node._id);

        });
      }).done(function () {
        sensors.exec().then(function (sensors) {
          sensors.forEach(function (sensor) {
            if (self.controller.nodes[sensor._nodeId])
              self.controller.addSensor(sensor, self.controller.nodes[sensor._nodeId], sensor._id);
            else {
              self.db.sensors.remove({ _id: sensor._id }, {}, function (err, numRemoved) {
                console.log("Sensor removed because owner node not found".bold.red, sensor.name, numRemoved);
              });
            }
          })
        }).done(function () {
          deviceListActive.forEach(function (device) {
            device.connect();
          });
          log.profile('database');
          self.controller.loadDBCompleted();
        });
      });

      controller.on('newDevice', function (newDevice) {
        self.db.devices.insert(serializeObj(newDevice), function (err, newDoc) {   // Callback is optional
          console.log('New Device inserted to Database'.bold.red);
          console.log(newDoc);
        });
      });

      controller.on('newNode', function (newNode) {
        self.db.nodes.insert(serializeObj(newNode), function (err, newDoc) {   // Callback is optional
          console.log('New Node inserted to Database'.bold.red);
          console.log(newDoc);
        });
      });

      controller.on('newSensor', function (newSensor) {
        self.db.sensors.insert(serializeObj(newSensor), function (err, newDoc) {   // Callback is optional
          console.log('New Sensor inserted to Database'.bold.red);
          console.log(newDoc);
        });
      });

      controller.on('updateNode', function (node) {
        self.db.nodes.update({_id: node._id}, {$set: serializeObj(node)}, {}, function (err, numReplaced) {
          //console.log('Node Updated to BD'.bold.red);
        });
      });

      controller.on('deleteNode', function (node) {
        self.db.sensors.remove({_nodeId: node._id}, { multi: true }, function (err, numRemoved) {
          console.log('Deleted ' + numRemoved + ' sensors');
        });
        self.db.nodes.remove({_id: node._id}, {}, function (err, numRemoved) {
          console.log('Node deleted to BD'.bold.red);
        });
      });

      controller.on('updateSensor', function (sensor) {
        self.db.sensors.update({_id: sensor._id}, {$set: serializeObj(sensor)}, {}, function (err, numReplaced) {
          //console.log('Node Updated to BD'.bold.red);
        });
      });

      controller.on('newSensorValue', function (sensor, value) {
        var doc = serializeObj(value);
        doc._sensorId = sensor._id;
        self.db.sensorsVal.insert(doc, function (err, newDoc) {   // Callback is optional
          //console.log('New Sensor Value Inserted to Database'.bold.red);
          //console.log(JSON.stringify(newDoc, null, 2));
        });
      });

    });
  };
}

module.exports = hsDatabase;

