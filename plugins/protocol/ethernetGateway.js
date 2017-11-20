"use strict";

/**
 * Created by chune on 2016-10-11.
 */


const mySensor = require("./serialProtocol.js");
const plugins = require("../../lib/hsPlugins.js");
const net = require('net');
const moment  = require('moment');

class mySensorsEthernetDevice extends plugins {

  constructor(controller, params) {
    super(controller, params);
    var buffer = '';
    var self = this;

    self.log = params.logger.addLogger('mySensorsEthernetGateway', {fileName: './logs/mySensorsEthernetGateway.log'});

    controller.addDevice(this);

    this.__mySensor = new mySensor(this);
    this.__client = new net.Socket();
    this.__msgToSendQueue = [];

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

    this.__client.on('connect', function() {
       console.log('ethernetGatewayConnected');
       self.__controller.vars['ethernetGatewayConnected'] = true;
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
    var self = this;
    var sendMessage = function(){
      let msg = self.__msgToSendQueue[0].toString();
      console.log('Send Message To Node', msg );
      self.__client.write(msg);
      if (self.__msgToSendQueue.length > 0) {
         setTimeout(function(){
           self.__msgToSendQueue.shift();
           if (self.__msgToSendQueue.length > 0)
             sendMessage();
         }, 1000);
      }
    };

    this.__msgToSendQueue.push(new this.__mySensor.message({
      nodeId: node.vendor.id,
      childSensorId: sensor.vendor.id,
      messageType: this.__mySensor.protocol.messageType.set,
      ack: 0,
      subType: subType,
      payLoad: msgVal
    }));

    if (this.__msgToSendQueue.length <= 1)
      sendMessage();
  }

  reboot(node, now) {
    this.log.info('Stack reboot node msg to ', node);
    var msg = new this.__mySensor.message({
      nodeId: node.vendor.id,
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


