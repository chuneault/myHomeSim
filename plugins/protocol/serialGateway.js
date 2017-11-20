"use strict";

/**
 * Created by chune on 2016-10-11.
 */


const mySensor = require("./serialProtocol.js");
const plugins = require("../../lib/hsPlugins.js");
var SerialPort = require("serialport");

class mySensorsSerialDevice extends plugins {

  constructor(controller, params) {
    super(controller, params);
    var self = this;

    self.log = params.logger.addLogger('mySensorsSerialGateway', {fileName: './logs/mySensorsSerialGateway.log'});

    controller.addDevice(this);

    this.__mySensor = new mySensor(this);

    controller.on('loadDBCompleted', function(){
      self.log.info('Connecting to mySensors Serial Gateway', self.params.port.bold);
      self.__client  = new SerialPort(self.params.port || 'COM4', {
        baudRate: self.params.baudRate || 38400,
        parser: SerialPort.parsers.readline('\n')
      });

      self.__client.on('data', function(data) {
            self.__mySensor.parseSerialMessage(data);
            self.__log.info(data, {type: 'SerialMessage'});
            self.log.log('debug', data, {type: 'SerialMessage'});
          }
      );
      self.__client.on('open', function() {
        self.log.info('mySensorsSerialGateway Opened'.bold.red);
      });

      self.__client.on('error', function(err) {
        self.log.error(err.message.bold.red);
      });

      self.__client.on('close', function() {
        self.log.error('mySensorsSerialGateway Connection closed'.bold.red);
      });

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
    this.log.info('Stack reboot node msg to ', node._id);
    var msg = new this.__mySensor.message({
      nodeId: node.vendor.id,
      childSensorId: node.vendor.id,
      messageType: this.__mySensor.protocol.messageType.internal,
      ack: 0,
      subType: this.__mySensor.protocol.internal.I_REBOOT,
      payLoad: ""
    });

    if (!now)
      node.__msgToSend = msg;
    else
      this.__client.write(msg.toString());
  }


}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'mySensorsSerial',
    params: params,
    pluginClass: mySensorsSerialDevice
  });
};


