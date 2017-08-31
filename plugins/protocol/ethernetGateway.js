"use strict";

/**
 * Created by chune on 2016-10-11.
 */


const mySensor = require("./serialProtocol.js");
const plugins = require("../../lib/hsPlugins.js");
const net = require('net');

class mySensorsEthernetDevice extends plugins {

  constructor(controller, params) {
    super(controller, params);
    var buffer = '';
    var self = this;

    self.log = params.logger.addLogger('mySensorsEthernetGateway', {fileName: './logs/mySensorsEthernetGateway.log'});

    controller.addDevice(this);

    this.__mySensor = new mySensor(this);
    this.__client = new net.Socket();

    controller.on('loadDBCompleted', function(){

      controller.checkNodeHeartBeat();
      self.log.info('Connecting to mySensors Ethernet Gateway', self.params.url.bold);
      self.connect(self.params.url, self.params.port);
    });

    this.__client.on('data', function(data) {
      var i;
      buffer+=data;
      while ((i = buffer.indexOf('\n')) > -1) {
        var msg = buffer.substring(0, i);
        buffer = buffer.substring(i+1);
        self.__mySensor.parseSerialMessage(msg);
        self.__log.info(msg, {type: 'SerialMessage'});
      }
    });

    this.__client.on('close', function() {
      self.log.error('mySensorsEthernetGateway Connection closed'.bold.red);
    });


  };

  connect(url, port) {
    if (!url) url = this.params.url;
    if (!port) port = this.params.port;
    var self = this;
    this.__client.connect(port, url, function() {
      self.log.info('Connected to mySensorsEthernetDevice');
      self.__client.write("\n");
    });

  };

  send(node, sensor, subType, msgVal) {
    var msg = new this.__mySensor.message({
      nodeId: node.id,
      childSensorId: sensor.id,
      messageType: this.__mySensor.protocol.messageType.set,
      ack: 0,
      subType: subType,
      payLoad: msgVal
    });
    this.__client.write(msg.toString());
  }

  reboot(node, now) {
    this.log.info('Stack reboot node msg to ', node.name);
    var msg = new this.__mySensor.message({
      nodeId: node.id,
      childSensorId: 0,
      messageType: this.__mySensor.protocol.messageType.internal,
      ack: 0,
      subType: this.__mySensor.protocol.internal.I_REBOOT,
      payLoad: ""
    });
    node.__msgToSend = msg;
    if (!now)
      node.__msgToSend = msg;
    else
      this.__client.write(msg.toString());
  }

}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'mySensorsEthernet',
    params: params,
    pluginClass: mySensorsEthernetDevice
  });
};


