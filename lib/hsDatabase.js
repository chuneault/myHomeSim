"use strict";

const _ = require('lodash'),
      path = require('path'),
      util = require('util'),
      MongoClient = require('mongodb').MongoClient,
      assert = require('assert'),
      Dequeue = require('dequeue'),
      Binary = require('mongodb').Binary,
      ObjectID = require('mongodb').ObjectID;

let serializeObj = function (obj) {
  return _.omitBy(obj, function (val, key) {
    return (_.startsWith(key, '__') || _.isFunction(val));
  });
};

class hsDatabase {

  constructor(controller, config) {

    let self = this;
    self.controller = controller;
    self.logger = controller.logger;
    self.log = self.logger['core'];
    self.log.profileTime('database');

    this.config = config;


      MongoClient.connect(config.db.url, { useNewUrlParser: true }, function(err, client) {
          assert.equal(null, err);
          self.log.info("Connected correctly to mongo server");

          self.db = client.db(config.db.dbName);
          self.controller.__db = self.db;

          self.db.nodesUpdateQueue = new Dequeue();
          self.db.sensorsUpdateQueue = new Dequeue();

          self.db.collection('plugin').find({active: true}).toArray(function(err, plugins) {
              assert.equal(err, null);
              plugins.forEach(function (plugin) {
                  //console.log(process.cwd());
                  require('plug').create(plugin.plugin, plugin)
                      .on('connect', function (pluginName, pluginData, modulePath) {
                          self.log.info('loaded plugin', pluginName);
                          pluginData.params.logger = self.logger;
                          self.controller.plugins[pluginName] =  new pluginData.pluginClass(self.controller, pluginData.params);
                      }).load(process.cwd() + util.format('/plugins/%s/%s.js', plugin.plugin, plugin.name));

              });

              self.db.collection('node').find({}).toArray(function (err, nodes) {
                  assert.equal(err, null);
                  nodes.forEach(function (node) {
                      self.controller.addNode(node, self.controller.devices[node.deviceId], node._id);
                  });

                  self.db.collection('sensor').find({}).toArray(function (err, sensors) {
                      assert.equal(err, null);
                      sensors.forEach(function (sensor) {
                          if (self.controller.nodes[sensor.nodeId])
                              self.controller.addSensor(sensor, self.controller.nodes[sensor.nodeId], sensor._id);
                          else {
                              self.log.warn('sensor without node', sensor);
                              self.db.collection('sensor').deleteOne(sensor, function(error, doc) {
                                  assert.equal(null, err);
                                  self.log.info('sensor deleted', doc);
                              });
                          }
                      });

                      loadDBComplete();

                  });
              });
          });
      });

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

              self.log.profileEnd('database');

              controller.on('newNode', function (newNode) {
                  self.db.collection('node').insertOne(serializeObj(newNode), function (err, newDoc) {   // Callback is optional
                      assert.equal(err, null);
                      self.log.info('New Node inserted to Database'.bold.red);
                      //console.log(newDoc);
                  });
              });

              controller.on('newSensor', function (newSensor) {
                  self.db.collection('sensor').insertOne(serializeObj(newSensor), function (err, newDoc) {   // Callback is optional
                      assert.equal(err, null);
                      self.log.info('New Sensor inserted to Database'.bold.red);
                  });
              });

              controller.on('updateNode', function (node, itemToUnset) {
                  self.db.nodesUpdateQueue.push(node);
                  let updateNodeDB = function () {
                      let node = self.db.nodesUpdateQueue.first();
                      let mongoUpdate = {$set:  serializeObj(node)};
                      if (!_.isEmpty(itemToUnset)) mongoUpdate.$unset = itemToUnset;
                      self.db.collection('node').findOneAndUpdate({_id: node._id}, mongoUpdate, function (err, newDoc) {
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
                  self.db.collection('node').deleteOne({_id: node._id} , function(error) {
                      assert.equal(null, error);
                  });
                  self.log.warn('toto delete sensors node');
              });

              controller.on('deleteSensor', function (sensor) {
                  self.db.collection('sensor').deleteOne({_id: sensor._id}, function(error) {
                      assert.equal(null, error);
                  });

              });

              controller.on('updateSensor', function (sensor, itemToUnset) {
                  self.db.sensorsUpdateQueue.push(sensor);
                  let updateSensorDB = function () {
                      let sensor = self.db.sensorsUpdateQueue.first();
                      let mongoUpdate = {$set:  serializeObj(sensor)};
                      if (!_.isEmpty(itemToUnset)) mongoUpdate.$unset = itemToUnset;
                      self.db.collection('sensor').findOneAndUpdate({_id: sensor._id}, mongoUpdate, function (err, newDoc) {
                          assert.equal(err, null);
                          self.db.sensorsUpdateQueue.shift();
                          if (self.db.sensorsUpdateQueue.length > 0)
                              updateSensorDB();
                      });
                  };

                  if (self.db.sensorsUpdateQueue.length == 1)
                      updateSensorDB();
              });

              controller.on('newFileAttachement', function(data, callback){
                  let insert_data = {};
                  insert_data.file_data = Binary(data);
                  self.db.collection('files').insert(insert_data, function(err, result){
                      assert.equal(err, null);
                      callback(result);
                  });
              });

            controller.on('getFileAttachement', function(fileId, callback){
                self.db.collection('files').find({ _id: new ObjectID(fileId)}).toArray(function(err, result){
                    assert.equal(err, null);
                    result.forEach(function (file) {
                      callback({base64: file.file_data.buffer.toString('base64')});
                    });
                });
            });

              controller.on('newSensorValue', function (sensor, value) {
                  let doc = serializeObj(value);
                  doc.sensorId = sensor._id;
                  self.db.collection('sensorsValues').insertOne(doc, function (err, newDoc) {   // Callback is optional
                       assert.equal(null, err);
                       assert.equal(1, newDoc.insertedCount);
                  });
              });

              self.controller.loadDBCompleted();
          }
  }
}

module.exports = hsDatabase;

