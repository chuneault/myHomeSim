"use strict";

const _ = require('lodash'),
      path = require('path'),
      util = require('util'),
      PouchDB = require('pouchdb');

PouchDB.plugin(require('pouchdb-find'));


let serializeObj = function (obj) {
  return _.omitBy(obj, function (val, key) {
    return (_.startsWith(key, '__') || _.isFunction(val));
  });
};

class hsDatabase {

  constructor(controller, config) {

    var self = this;
    self.controller = controller;
    self.logger = controller.logger;
    var log = self.logger['core'];
    log.profile('database');

    this.db = {};

    this.config = config;

    this.db.plugins = new PouchDB(config.db.master);
    //this.db.plugins.loadDatabase();

    this.db.nodes = new PouchDB(config.db.master);
    //this.db.nodes.loadDatabase();

    this.db.sensors = new PouchDB(config.db.master);
    //this.db.sensors.loadDatabase();

    this.db.sensorsVal = new PouchDB(config.db.sensorsValues);
    //this.db.sensorsVal.loadDatabase();

    //this.db.plugins.persistence.setAutocompactionInterval(300000);

    controller.__db = this.db;

    var plugins = this.db.plugins.find({
          selector: {
              type: {$eq: 'plugin'},
              active: {$eq: true}
          }
      });

    var nodes = this.db.nodes.find({
        selector: {
            type: {$eq: 'node'}
        }
    });

    var sensors = this.db.sensors.find({
        selector: {
            type: {$eq: 'sensor'}
        }
    });

    var deviceListActive = [];

    plugins.then(function (plugins) {
      plugins.docs.forEach(function (plugin) {
        require('plug').create(plugin.plugin, plugin)
            .on('connect', function (pluginName, pluginData, modulePath) {
              log.info('loaded plugin', pluginName.bold);
              pluginData.params.logger = self.logger;
              new pluginData.pluginClass(self.controller, pluginData.params);
            }).load(path.dirname(process.argv[1]) + util.format('/plugins/%s/%s.js', plugin.plugin, plugin.name));
      });

      nodes.then(function (nodes) {
          nodes.docs.forEach(function (node) {
              self.controller.addNode(node, self.controller.devices[node.deviceId], node._id);
          });

          sensors.then(function (sensors) {
              sensors.docs.forEach(function (sensor) {
                  if (self.controller.nodes[sensor.nodeId])
                      self.controller.addSensor(sensor, self.controller.nodes[sensor.nodeId], sensor._id);
                  else {
                      self.db.sensors.remove({_id: sensor._id}, {}, function (err, doc) {
                          if (err)
                            console.log('sensor remove error with no node', err);
                          else
                            console.log("Sensor removed because owner node not found".bold.red, doc);
                      });
                  }
              });

              deviceListActive.forEach(function (device) {
                  device.connect();
              });

              log.profile('database');
              self.controller.loadDBCompleted();

          }).catch(function (err) {
              console.log(err);
          });

      }).catch(function (err) {
            console.log(err);
        });

      /*controller.on('newDevice', function (newDevice) {
        self.db.devices.put(serializeObj(newDevice), function (err, newDoc) {   // Callback is optional
          console.log('New Device inserted to Database'.bold.red);
          console.log(newDoc);
        });
      });*/

      controller.on('newNode', function (newNode) {
        self.db.nodes.put(serializeObj(newNode), function (err, newDoc) {   // Callback is optional
          console.log('New Node inserted to Database'.bold.red);
          console.log(newDoc);
        });
      });

      controller.on('newSensor', function (newSensor) {
        self.db.sensors.put(serializeObj(newSensor), function (err, newDoc) {   // Callback is optional
          console.log('New Sensor inserted to Database'.bold.red);
          console.log(newDoc);
        });
      });

      controller.on('updateNode', function (node) {
          self.db.nodes.get(node._id, function(error, doc) {
              if (error) {
                  debugger;
                  console.log('DB get updateNode Error', error);
              }
              else {
                  let lastRev = doc._rev;
                  _.extend(doc, serializeObj(node));
                  doc._rev = lastRev;
                  self.db.nodes.put(doc, function(error, doc) {
                      if (error)
                          console.log('DB put updateNode Error', error);
                  });
              }
          });
      });

      controller.on('deleteNode', function (node) {

          self.db.nodes.get(node._id, function(error, doc) {
              if (error)
                  console.log('DB get deleteNode Error', error);
              else {
                  //_.extend(doc, serializeObj(node));
                  self.db.nodes.remove(doc, function(error, doc) {
                      if (error)
                          console.log('DB remove deleteNode Error', error);
                  });
              }
          });


        console.log('toto delete sensors node');
        /*self.db.sensors.remove({nodeId: node._id}, { multi: true }, function (err, numRemoved) {
          console.log('Deleted ' + numRemoved + ' sensors');
        });
        self.db.nodes.remove({_id: node._id}, {}, function (err, numRemoved) {
          console.log('Node deleted to BD'.bold.red);
        });*/
      });

      controller.on('updateSensor', function (sensor) {
        /*self.db.sensors.update({_id: sensor._id}, {$set: serializeObj(sensor)}, {}, function (err, numReplaced) {
          //console.log('Node Updated to BD'.bold.red);
        });*/

          self.db.sensors.get(sensor._id, function(error, doc) {
              if (error) {
                  debugger;
                  console.log('DB get updateSensor Error', error);
              }
              else {
                  let lastRev = doc._rev;
                  _.extend(doc, serializeObj(sensor));
                  doc._rev = lastRev;
                  self.db.sensors.put(doc, function(error, doc) {
                      if (error) {
                          debugger;
                          console.log('DB put updateSensor Error', error);
                      }
                  });
              }
          });
      });

      controller.on('newSensorValue', function (sensor, value) {
        let doc = serializeObj(value);
        doc.sensorId = sensor._id;
        self.db.sensorsVal.post(doc, function (err, newDoc) {   // Callback is optional
          if (err)
              console.log('DB newSensorValue error', err);
        });
      });

    }).catch(function (err) {
          console.log(err);
      });
  };
}

module.exports = hsDatabase;

