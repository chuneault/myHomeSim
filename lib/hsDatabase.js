"use strict";

const _ = require('lodash'),
      path = require('path'),
      util = require('util'),
      MongoClient = require('mongodb').MongoClient,
      assert = require('assert');

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

    this.config = config;


      MongoClient.connect(config.db.url, { useNewUrlParser: true }, function(err, client) {
          assert.equal(null, err);
          console.log("Connected correctly to mongo server");

          this.db = client.db(config.db.dbName);

          this.db.collection('plugin').find({active: true}).toArray(function(err, plugins) {
              assert.equal(err, null);
              plugins.forEach(function (plugin) {
                  require('plug').create(plugin.plugin, plugin)
                      .on('connect', function (pluginName, pluginData, modulePath) {
                          log.info('loaded plugin', pluginName.bold);
                          pluginData.params.logger = self.logger;
                          new pluginData.pluginClass(self.controller, pluginData.params);
                      }).load(path.dirname(process.argv[1]) + util.format('/plugins/%s/%s.js', plugin.plugin, plugin.name));

              });

              this.db.collection('node').find({active: true}).toArray(function (err, nodes) {
                  assert.equal(err, null);
                  nodes.forEach(function (node) {
                      self.controller.addNode(node, self.controller.devices[node.deviceId], node._id);
                  });

                  this.db.collection('sensor').find({active: true}).toArray(function (err, sensors) {
                      assert.equal(err, null);
                      sensors.forEach(function (sensor) {
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

                      loadDBComplete();

                  });
              });
          });
      });


    controller.__db = this.db;


    var deviceListActive = [];


    function assignDoc(doc, source) {
        //let lastRev = doc._rev;
        let updateDoc = source;
        if (updateDoc.vendor) {
            if (doc.vendor)
                _.extend(doc.vendor, updateDoc.vendor);
            else
                doc.vendor = updateDoc.vendor;
            delete (updateDoc.vendor);
        }
        _.extend(doc, updateDoc);
        //doc._rev = lastRev;
    }

    function loadDBComplete() {
              deviceListActive.forEach(function (device) {
                  device.connect();
              });

              log.profile('database');

              controller.on('newNode', function (newNode) {
                  self.db.collection('node').insertOne(serializeObj(newNode), function (err, newDoc) {   // Callback is optional
                      assert.equal(err, null);
                      console.log('New Node inserted to Database'.bold.red);
                      console.log(newDoc);
                  });
              });

              controller.on('newSensor', function (newSensor) {
                  self.db.collection('sensor').insertOne(serializeObj(newSensor), function (err, newDoc) {   // Callback is optional
                      assert.equal(err, null);
                      console.log('New Sensor inserted to Database'.bold.red);
                      console.log(newDoc);
                  });
              });

              controller.on('updateNode', function (node) {
                  self.db.nodesUpdateQueue.push(node);
                  let updateNodeDB = function () {
                      let node = self.db.nodesUpdateQueue.first();
                      let doc = self.controller.nodes[node._id];
                      assignDoc(doc, serializeObj(node));
                      self.db.collection('node').updateOne({_id: node._id}, doc, function (err, newDoc) {
                          assert.equal(err, null);
                          self.db.nodesUpdateQueue.shift();
                          if (self.db.nodesUpdateQueue.length > 0)
                              updateNodeDB();
                      });
                  };

                  if (self.db.nodesUpdateQueue.length == 1)
                      updateNodeDB();
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
                  let updateSensorDB = function () {
                      let node = self.db.sensorsUpdateQueue.first();
                      let doc = self.controller.sensors[sensor._id];
                      assignDoc(doc, serializeObj(sensor));
                      self.db.collection('sensor').updateOne({_id: sensor._id}, doc, function (err, newDoc) {
                          assert.equal(err, null);
                          self.db.sensorsUpdateQueue.shift();
                          if (self.db.sensorsUpdateQueue.length > 0)
                              updateSensorDB();
                      });
                  };

                  if (self.db.sensorsUpdateQueue.length == 1)
                      updateSensorDB();
              });

              controller.on('newSensorValue', function (sensor, value) {
                  /*let doc = serializeObj(value);
                  doc.sensorId = sensor._id;
                  self.db.sensorsVal.post(doc, function (err, newDoc) {   // Callback is optional
                      if (err)
                          console.log('DB newSensorValue error', err);
                  });*/
              });
              self.controller.loadDBCompleted();
          }
  }

}

module.exports = hsDatabase;

