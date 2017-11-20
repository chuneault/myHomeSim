"use strict";

/**
 * Created by chune on 2016-10-11.
 */

const s = require('string');
const _ = require('lodash');

const mySensorsProtocol = {

  messageType: {
    presentation: 0,
    set: 1,
    req: 2,
    internal: 3,
    stream: 4
  },

  presentation: {
    S_DOOR: 0,
    S_MOTION: 1,
    S_SMOKE: 2,
    S_BINARY: 3,
    S_DIMMER: 4,
    S_COVER: 5,
    S_TEMP: 6,
    S_HUM: 7,
    S_BARO: 8,
    S_WIND: 9,
    S_RAIN: 10,
    S_UV: 11,
    S_WEIGHT: 12,
    S_POWER: 13,
    S_HEATER: 14,
    S_DISTANCE: 15,
    S_LIGHT_LEVEL: 16,
    S_ARDUINO_NODE: 17,
    S_ARDUINO_RELAY: 18,
    S_LOCK: 19,
    S_IR: 20,
    S_WATER: 21,
    S_AIR_QUALITY: 22,
    S_CUSTOM: 23,
    S_DUST: 24,
    S_SCENE_CONTROLLER: 25,
    S_RGB_LIGHT: 26, //	RGB light	V_RGB, V_WATT
    S_RGBW_LIGHT: 27, //	RGBW light (with separate white component)	V_RGBW, V_WATT
    S_COLOR_SENSOR: 28, //	Color sensor	V_RGB
    S_HVAC: 29, //	Thermostat/HVAC device	V_HVAC_SETPOINT_HEAT, V_HVAC_SETPOINT_COLD, V_HVAC_FLOW_STATE, V_HVAC_FLOW_MODE, V_HVAC_SPEED
    S_MULTIMETER: 30, //	Multimeter device	V_VOLTAGE, V_CURRENT, V_IMPEDANCE
    S_SPRINKLER: 31, //	Sprinkler device	V_STATUS (turn on/off), V_TRIPPED (if fire detecting device)
    S_WATER_LEAK: 32, //	Water leak sensor	V_TRIPPED, V_ARMED
    S_SOUND: 33, //	Sound sensor	V_LEVEL (in dB), V_TRIPPED, V_ARMED
    S_VIBRATION: 34, //	Vibration sensor	V_LEVEL (vibration in Hz), V_TRIPPED, V_ARMED
    S_MOISTURE: 35, //	Moisture sensor	V_LEVEL (water content or moisture in percentage?), V_TRIPPED, V_ARMED
    S_INFO: 36, //	LCD text device	V_TEXT
    S_GAS: 37, //	Gas meter	V_FLOW, V_VOLUME
    S_GPS: 38, //	GPS Sensor	V_POSITION
    S_WATER_QUALITY: 39 //Water quality sensor
  },

  subType: {
    V_TEMP: 0,
    V_HUM: 1,
    V_STATUS: 2,
    V_PERCENTAGE: 3,
    V_PRESSURE: 4,
    V_FORECAST: 5,
    V_RAIN: 6,
    V_RAINRATE: 7,
    V_WIND: 8,
    V_GUST: 9,
    V_DIRECTION: 10,
    V_UV: 11,
    V_WEIGHT: 12,
    V_DISTANCE: 13,
    V_IMPEDANCE: 14,
    V_ARMED: 15,
    V_TRIPPED: 16,
    V_WATT: 17,
    V_KWH: 18,
    V_SCENE_ON: 19,
    V_SCENE_OFF: 20,
    V_HEATER: 21,
    V_HEATER_SW: 22,
    V_LIGHT_LEVEL: 23,
    V_VAR1: 24,
    V_VAR2: 25,
    V_VAR3: 26,
    V_VAR4: 27,
    V_VAR5: 28,
    V_UP: 29,
    V_DOWN: 30,
    V_STOP: 31,
    V_IR_SEND: 32,
    V_IR_RECEIVE: 33,
    V_FLOW: 34,
    V_VOLUME: 35,
    V_LOCK_STATUS: 36,
    V_DUST_LEVEL: 37,
    V_VOLTAGE: 38,
    V_CURRENT: 39,
    V_RGB: 40, //	RGB value transmitted as ASCII hex string (I.e "ff0000" for red)	S_RGB_LIGHT, S_COLOR_SENSOR
    V_RGBW: 41, //	RGBW value transmitted as ASCII hex string (I.e "ff0000ff" for red + full white)	S_RGBW_LIGHT
    V_ID: 42, //	Optional unique sensor id (e.g. OneWire DS1820b ids)	S_TEMP
    V_UNIT_PREFIX: 43, //	Allows sensors to send in a string representing the unit prefix to be displayed in GUI. This is not parsed by controller! E.g. cm, m, km, inch.	S_DISTANCE, S_DUST, S_AIR_QUALITY
    V_HVAC_SETPOINT_COOL: 44, //	HVAC cold setpoint	S_HVAC
    V_HVAC_SETPOINT_HEAT: 45, //	HVAC/Heater setpoint	S_HVAC, S_HEATER
    V_HVAC_FLOW_MODE: 46, //	Flow mode for HVAC ("Auto", "ContinuousOn", "PeriodicOn")	S_HVAC
    V_TEXT: 47, //	Text message to display on LCD or controller device	S_INFO
    V_CUSTOM: 48, //	Custom messages used for controller/inter node specific commands, preferably using S_CUSTOM device type.	S_CUSTOM
    V_POSITION: 49, //	GPS position and altitude. Payload: latitude;longitude;altitude(m). E.g. "55.722526;13.017972;18"	S_GPS
    V_IR_RECORD: 50, //	Record IR codes S_IR for playback	S_IR
    V_PH: 51, //	Water PH	S_WATER_QUALITY
    V_ORP: 52, //	Water ORP : redox potential in mV	S_WATER_QUALITY
    V_EC: 53, //	Water electric conductivity μS/cm (microSiemens/cm)	S_WATER_QUALITY
    V_VAR: 54, //	Reactive power: volt-ampere reactive (var)	S_POWER
    V_VA: 55, //	Apparent power: volt-ampere (VA)	S_POWER
    V_POWER_FACTOR: 56 //	Ratio of real power to apparent power: floating point value in the range [-1,..,1]
  },

  internal: {
    I_BATTERY_LEVEL: 0,
    I_TIME: 1,
    I_VERSION: 2,
    I_ID_REQUEST: 3,
    I_ID_RESPONSE: 4,
    I_INCLUSION_MODE: 5,
    I_CONFIG: 6,
    I_FIND_PARENT: 7,
    I_FIND_PARENT_RESPONSE: 8,
    I_LOG_MESSAGE: 9,
    I_CHILDREN: 10,
    I_SKETCH_NAME: 11,
    I_SKETCH_VERSION: 12,
    I_REBOOT: 13,
    I_GATEWAY_READY: 14,
    I_REQUEST_SIGNING: 15, //	Used between sensors when initialting signing.
    I_GET_NONCE: 16, //Used between sensors when requesting nonce.
    I_GET_NONCE_RESPONSE: 17, //	Used between sensors for nonce response.
    I_HEARTBEAT: 18, //	Heartbeat request
    I_PRESENTATION: 19, //	Presentation message
    I_DISCOVER: 20, //	Discover request
    I_DISCOVER_RESPONSE: 21, //	Discover response
    I_HEARTBEAT_RESPONSE: 22, //	Heartbeat response
    I_LOCKED: 23, //	Node is locked (reason in string-payload)
    I_PING: 24, //	Ping sent to node, payload incremental hop counter
    I_PONG: 25, //	In return to ping, sent back to sender, payload incremental hop counter
    I_REGISTRATION_REQUEST: 26, //	Register request to GW
    I_REGISTRATION_RESPONSE: 27, //	Register response from GW
    I_DEBUG: 28, //	Debug message

  },

  getName: function (config, value) {
    for (let item in config) {
      if (config[item] === value) {
        return item;
      }
    }
  },

};

class mySensorsMessage {

  constructor(serialMessage) {
    if (_.isString(serialMessage)) {
      let msgArray = s(serialMessage).parseCSV(';');
      this.nodeId = parseInt(msgArray[0]);
      this.childSensorId = parseInt(msgArray[1]);
      this.messageType = parseInt(msgArray[2]);
      this.ack = parseInt(msgArray[3]);
      this.subType = parseInt(msgArray[4]);
      let val = msgArray[5];
      if (!isNaN(val))
        val = parseFloat(val);
      this.payLoad = val;
    }
    else
      _.extend(this, serialMessage);
  };

  toString() {
    return this.nodeId + ';' + this.childSensorId + ';' + this.messageType + ';' + this.ack + ';' + this.subType + ';' + this.payLoad + '\n';
  };

}

class mySensors {

  constructor(device) {
    this.device = device;
    this.protocol = mySensorsProtocol;
    this.message = mySensorsMessage;
  }

  parseSerialMessage(serialMessage) {
    var msg = new mySensorsMessage(serialMessage);
    var self = this;
    var ctrl = this.device.__controller;

    //if ((msg.messageType == 3) || (msg.nodeId == 72))
    switch (msg.messageType) {

        //presentation
      case mySensorsProtocol.messageType.presentation :
        if (msg.subType == mySensorsProtocol.presentation.S_ARDUINO_NODE) //new Node
          ctrl.addOrUpdateNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
              {vendor: {id: msg.nodeId, mySensorsVersion: msg.payLoad}}, self.device);
        else if (msg.childSensorId != 255) {  //new Sensor
          ctrl.addOrGetNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
              {vendor: {id: msg.nodeId, name: 'unknown'}}, self.device,
              function (error, node) {
                if (node)
                  ctrl.addOrUpdateSensor({nodeId: node._id, vendor: {id: msg.childSensorId}}, {
                    vendor: {
                        id: msg.childSensorId,
                        name: mySensorsProtocol.getName(mySensorsProtocol.presentation, msg.subType),
                        type: msg.subType,
                        desc: msg.payLoad
                    }
                  }, node);
              });
        }
        break;

      case mySensorsProtocol.messageType.set :
        ctrl.addOrGetNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
            {vendor: {id: msg.nodeId, name: 'unknown'}}, self.device,
            function (error, node) {
              if (node)
                ctrl.findSensor({nodeId: node._id, vendor: {id: msg.childSensorId}},
                    function (notFound, sensor) {
                      if (notFound)
                        sensor = ctrl.addSensor({vendor: {
                          id: msg.childSensorId,
                          name: 'unknown'}
                        }, node);
                      ctrl.addSensorValue(sensor, msg.payLoad);
                      sensor.__log.info(serialMessage, {type: 'set'});
                    });
            });

        break;

      case
      mySensorsProtocol.messageType.internal
      :
        switch (msg.subType) {
          case mySensorsProtocol.internal.I_SKETCH_NAME:
            ctrl.findNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
                function (notFound, node) {
                  if (node)
                    ctrl.updateNode(node, {vendor: {name: msg.payLoad}});
                });

            break;
          case mySensorsProtocol.internal.I_SKETCH_VERSION:
            ctrl.findNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
                function (notFound, node) {
                  if (node)
                    ctrl.updateNode(node, {vendor: {version: msg.payLoad}});
                });
            break;
          case mySensorsProtocol.internal.I_BATTERY_LEVEL:
            ctrl.findNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
                function (notFound, node) {
                  if (node)
                    ctrl.updateNode(node, {batteryLevel: msg.payLoad});
                });
            break;
          case mySensorsProtocol.internal.I_ID_REQUEST:    //Node ID Request
            msg.payLoad = _.maxBy(_.values(ctrl.nodes), 'id').id + 1;
            msg.subType = mySensorsProtocol.internal.I_ID_RESPONSE;
            this.device.__client.write(msg.toString());
            break;
          case mySensorsProtocol.internal.I_CONFIG: //Config request from node. Reply with (M)etric or (I)mperal back to sensor.
            break;
          case mySensorsProtocol.internal.I_GATEWAY_READY:
            self.device.log.info(msg.payLoad.bold.green);
            break;
          case mySensorsProtocol.internal.I_VERSION:
            self.device.log.info('Gateway Version '.bold.green + msg.payLoad.bold.green);
            break;
          case mySensorsProtocol.internal.I_LOG_MESSAGE:
            break;
          case mySensorsProtocol.internal.I_DISCOVER_RESPONSE:
            break;
          case mySensorsProtocol.internal.I_HEARTBEAT_RESPONSE:
            ctrl.findNode({deviceId: self.device._id, vendor: {id: msg.nodeId}},
                function (notFound, node) {
                  if (node) {
                    if (node.__msgToSend) {
                      console.log('Reboot Message Sended'.bold.red, node.name);
                      node.__ownerDevice.__client.write(node.__msgToSend.toString());
                      delete(node.__msgToSend);
                    }

                    node.__log.info(serialMessage, {type: 'HeartBeat'});
                    ctrl.updateNode(node, {lastHeartBeat: _.now()});
                    delete(node.__alertSended);
                  }
                });
            break;
          default :
            console.log('Not Implemented Internal Msg', msg);

        }
    }
  };

}

module.exports = mySensors;
