"use strict";

const _ = require('lodash'),
      path = require('path'),
      util = require('util'),
      PouchDB = require('pouchdb'),
      Dequeue = require('dequeue');

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
    this.db.nodesUpdateQueue = new Dequeue();
    //this.db.nodes.loadDatabase();

    this.db.sensors = new PouchDB(config.db.master);
    this.db.sensorsUpdateQueue = new Dequeue();

    //this.db.sensors.loadDatabase();

    this.db.sensorsVal = new PouchDB(config.db.sensorsValues);
    //this.db.sensorsVal.loadDatabase();

    //this.db.plugins.persistence.setAutocompactionInterval(300000);

    controller.__db = this.db;

    /*var plugins = this.db.plugins.find({
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
    });*/

    var deviceListActive = [];


    function assignDoc(doc, source) {
        let lastRev = doc._rev;
        let updateDoc = source;
        if (updateDoc.vendor) {
            if (doc.vendor)
                _.extend(doc.vendor, updateDoc.vendor);
            else
                doc.vendor = updateDoc.vendor;
            delete (updateDoc.vendor);
        }
        _.extend(doc, updateDoc);
        doc._rev = lastRev;
    }

      this.db.plugins.find({selector: {
              type: {$eq: 'plugin'},
              active: {$eq: true}
          }
      }).then(function (plugins) {
        plugins.docs.forEach(function (plugin) {
        require('plug').create(plugin.plugin, plugin)
            .on('connect', function (pluginName, pluginData, modulePath) {
              log.info('loaded plugin', pluginName.bold);
              pluginData.params.logger = self.logger;
              new pluginData.pluginClass(self.controller, pluginData.params);
            }).load(path.dirname(process.argv[1]) + util.format('/plugins/%s/%s.js', plugin.plugin, plugin.name));
      });

          self.db.nodes.find({
              selector: {
                  type: {$eq: 'node'}
              }
          }).then(function (nodes) {
          nodes.docs.forEach(function (node) {
              self.controller.addNode(node, self.controller.devices[node.deviceId], node._id);
          });

              self.db.sensors.find({
                  selector: {
                      type: {$eq: 'sensor'}
                  }
              }).then(function (sensors) {
              sensors.docs.forEach(function (sensor) {
                  if (self.controller.nodes[sensor.nodeId])
                      self.controller.addSensor(sensor, self.controller.nodes[sensor.nodeId], sensor._id);
                  else {

                      self.db.sensors.get(sensor._id, function(error, doc) {
                          if (error)
                              console.log('Sensor get error with no node', error);
                          else {
                              //_.extend(doc, serializeObj(node));
                              self.db.sensors.remove(doc, function(error, doc) {
                                  if (error)
                                      console.log('Sensor remove error with no node', error);
                                  else
                                      console.log("Sensor removed because owner node not found".bold.red, doc);
                              });
                          }
                      });
                  }
              });

              deviceListActive.forEach(function (device) {
                  device.connect();
              });

              log.profile('database');

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
                  self.db.nodesUpdateQueue.push(node);
                  let updateNodeDB = function() {
                      let node = self.db.nodesUpdateQueue.first();
                      self.db.nodes.get(node._id).then(
                          function(doc) {
                              assignDoc(doc, serializeObj(node));
                              return self.db.nodes.put(doc);
                          }).then(function(response) {
                            self.db.nodesUpdateQueue.shift();
                            if (self.db.nodesUpdateQueue.length > 0)
                               updateNodeDB();
                          }).catch(
                              function (err) {
                               self.db.nodesUpdateQueue.shift();
                               console.log(err);
                               if (self.db.nodesUpdateQueue.length > 0)
                                  updateNodeDB();
                              }
                          );
                  };
                  if (self.db.nodesUpdateQueue.length == 1) {
                      updateNodeDB();
                  }
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
                  self.db.sensorsUpdateQueue.push(sensor);
                  let updateSensorDB = function() {
                      let sensor = self.db.sensorsUpdateQueue.first();
                      self.db.sensors.get(sensor._id).then(
                          function(doc) {
                              assignDoc(doc, serializeObj(sensor));
                              return self.db.sensors.put(doc);
                          }).then(function(response) {
                          self.db.sensorsUpdateQueue.shift();
                          if (self.db.sensorsUpdateQueue.length > 0)
                              updateSensorDB();
                      }).catch(
                          function (err) {
                              self.db.sensorsUpdateQueue.shift();
                              console.log(err);
                              if (self.db.sensorsUpdateQueue.length > 0)
                                  updateSensorDB();
                          }
                      );
                  };
                  if (self.db.sensorsUpdateQueue.length == 1) {
                      updateSensorDB();
                  }
              });

              controller.on('newSensorValue', function (sensor, value) {
                  let doc = serializeObj(value);
                  doc.sensorId = sensor._id;
                  self.db.sensorsVal.post(doc, function (err, newDoc) {   // Callback is optional
                      if (err)
                          console.log('DB newSensorValue error', err);
                  });
              });
              self.controller.loadDBCompleted();
          }

          ).catch(function (err) {
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


    }).catch(function (err) {
          console.log(err);
      });
  };
}

module.exports = hsDatabase;

