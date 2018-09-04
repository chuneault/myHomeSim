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

    var self = this;
    self.controller = controller;
    self.logger = controller.logger;
    var log = self.logger['core'];
    log.profile('database');

    this.config = config;


      MongoClient.connect(config.db.url, { useNewUrlParser: true }, function(err, client) {
          assert.equal(null, err);
          console.log("Connected correctly to mongo server");

          self.db = client.db(config.db.dbName);
          self.controller.__db = self.db;

          self.db.nodesUpdateQueue = new Dequeue();
          self.db.sensorsUpdateQueue = new Dequeue();

          self.db.collection('plugin').find({active: true}).toArray(function(err, plugins) {
              assert.equal(err, null);
              plugins.forEach(function (plugin) {
                  require('plug').create(plugin.plugin, plugin)
                      .on('connect', function (pluginName, pluginData, modulePath) {
                          log.info('loaded plugin', pluginName.bold);
                          pluginData.params.logger = self.logger;
                          new pluginData.pluginClass(self.controller, pluginData.params);
                      }).load(path.dirname(process.argv[1]) + util.format('/plugins/%s/%s.js', plugin.plugin, plugin.name));

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
                      //console.log(newDoc);
                  });
              });

              controller.on('newSensor', function (newSensor) {
                  self.db.collection('sensor').insertOne(serializeObj(newSensor), function (err, newDoc) {   // Callback is optional
                      assert.equal(err, null);
                      console.log('New Sensor inserted to Database'.bold.red);
                      //console.log(newDoc);
                  });
              });

              controller.on('updateNode', function (node) {
                  self.db.nodesUpdateQueue.push(node);
                  let updateNodeDB = function () {
                      let node = self.db.nodesUpdateQueue.first();
                      self.db.collection('node').findOneAndUpdate({_id: node._id}, { $set:  serializeObj(node) }, function (err, newDoc) {
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
                  self.db.collection('node').findOneAndDelete(node._id, function(error, doc) {
                      assert.equal(null, err);
                  });
                  console.log('toto delete sensors node');
              });

              controller.on('updateSensor', function (sensor) {
                  self.db.sensorsUpdateQueue.push(sensor);
                  let updateSensorDB = function () {
                      let sensor = self.db.sensorsUpdateQueue.first();
                      self.db.collection('sensor').findOneAndUpdate({_id: sensor._id}, { $set: serializeObj(sensor) }, function (err, newDoc) {
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
                console.log('getFileAttachement', fileId);
                //let insert_data = {};
                //insert_data.file_data = Binary(data);
                self.db.collection('files').find({ _id: new ObjectId(fileId)}).toArray(function(err, result){
                    console.log('getFileAttachement', result);
                    assert.equal(err, null);
                    result.forEach(function (file) {
                      console.log('getFileAttachement', file);
                      callback({});
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

