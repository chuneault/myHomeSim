const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const moment  = require('moment');

class openMQTTGateway extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        //self.log = params.logger.addLogger('espurnaRFBridge', {fileName: './logs/espurnaRFBridge.log'});
        self.log = params.logger.addSocket('espurnaRFBridge', {topic: 'espurnaRFBridge'});
        self.node = null;

        controller.addDevice(this);

        controller.on('loadDBCompleted', function () {

            self.__controller.addOrUpdateNode({id: 'openMQTTGateway'}, {
                    id: 'openMQTTGateway',
                    name: 'openMQTTGateway'
                }, self,
                function (error, node) {
                    self.node = node;
                    self.clients = {};

                    self.__controller.addOrUpdateSensor({nodeId: self.node._id, name: 'ARMED'}, {
                            name: 'ARMED', functionType: ['switch']
                        }, self.node,
                        function (err, sensor) {

                            self.sensorArmed = sensor;

                            self.alarmSensors = _.filter(self.__controller.sensors, function (o) {
                                return ((o.functionType) && (o.functionType.includes('pir') || o.functionType.includes('door')));
                            });

                            self.__controller.on('mqtt-newclient', function (client) {
                                if (client.id == 'SONOFF_RFBRIDGE') {
                                    self.clients[client.id] = client;
                                    self.log.info('new SONOFF_RFBRIDGE client', client.id);
                                }
                                if (!sensor.turnOn)
                                    sensor.turnOn = function () {
                                        //self.write(this, 'power', 'ON');
                                        self.__controller.addSensorValue(this, true);
                                        this.stateOn = true;
                                    };
                                if (!sensor.turnOff)
                                    sensor.turnOff = function () {
                                        //self.write(this, 'power', 'OFF');
                                        self.__controller.addSensorValue(this, false);
                                        this.stateOn = false;
                                    };

                            });

                            self.__controller.on('mqtt-published', function (packet, client) {
                                if (client && client.id && (client.id == 'SONOFF_RFBRIDGE')) {
                                    if (!self.clients[client.id]) self.clients[client.id] = client;
                                    self.log.info('SONOFF_RFBRIDGE published', client.id, packet.topic, packet.payload.toString());
                                    if (_.endsWith(packet.topic, '/data'))
                                        self.updateRFSensor(client.id, packet.topic, JSON.parse(packet.payload));
                                }
                            });


                            self.__controller.addObject('alarm', {
                                class: self,
                                checkArmedAlarm: self.checkArmedAlarm,
                                checkIfAlarm: self.checkIfAlarm
                            });

                        }, false);


                });
        });
    };

    checkArmedAlarm(countPersonsAtHome) {
        let self = this;
        if ((countPersonsAtHome == 0) && (self.sensorArmed.lastValue == false)) {  // si personne à la maison, on active l'alarme
            if (!_.every(self.alarmSensors, {lastValue: false})) { //un sensor ou PIR est resté actif...
                let sensorsOn = _.map(_.filter(self.alarmSensors, {lastValue: true}), 'desc');
                self.__controller.invokeAction('kik', 'sendMessage', ['Imposible ', 'carlturtle37']);
            }
            self.__controller.addSensorValue(self.sensorArmed, true);
            self.__controller.invokeAction('kik', 'sendMessage', ['ALARM ARMED', 'carlturtle37']);
        } else if ((countPersonsAtHome > 0) && (self.sensorArmed.lastValue == true)) {// si personne connues, à la maison, on déactive l'alarme
            self.__controller.addSensorValue(self.sensorArmed, false);
            self.__controller.invokeAction('kik', 'sendMessage', ['ALARM DE-ARMED', 'carlturtle37']);
        }
    }

    checkIfAlarm(fromSensor, delay = 5000) {
        let self = this;


        if (fromSensor && fromSensor._id == 'Sk_yZeRim' && fromSensor.lastValue == false) // porte arrière
          self.__controller.invokeAction('wizecam', 'sayHelloAtHome', []);

        let checkIfAlarmRunning = self.checkIfAlarmRunning || false;

        if (!checkIfAlarmRunning && self.sensorArmed.lastValue) {
            self.fromSensor = fromSensor;
            self.checkIfAlarmRunning = true;
            setTimeout(function () {
                if (self.sensorArmed.lastValue == true) {
                    //ALARM ALARM ALARM
                    self.__controller.invokeAction('kik', 'sendMessage', ['ALARM ALARM ALARM FROM ' + self.fromSensor.desc, 'carlturtle37']);
                }
                self.checkIfAlarmRunning = false;
            }, delay);
        }
    }


    //Published SONOFF_RFBRIDGE/data {"rfin":"368801CC054612730E","time":"2018-10-29 22:39:05","mac":"60:01:94:B2:9D:4D","host":"ESPURNA-B29D4D","ip":"192.168.2.66","id":2010}
    //Published SONOFF_RFBRIDGE/data {"app":"ESPURNA","version":"1.13.3","board":"ITEAD_SONOFF_RFBRIDGE","host":"ESPURNA-RFBRIDGE","ip":"192.168.2.66","mac":"60:01:94:B2:9D:4D","rssi":-58,"uptime":401,"datetime":"2018-10-30 08:34:59","freeheap":13320,"relay/0":0,"relay/1":0,"relay/2":0,"relay/3":0,"relay/4":0,"relay/5":0,"relay/6":0,"relay/7":0,"vcc":3122,"loadavg":1,"time":"2018-10-30 08:34:59","id":3003}


    checkAlwaysOpenDoor(sensor) {
        let self = this;
        if (self['_checkAlwaysOpenDoor' + sensor._id] == undefined) {
           self['_checkAlwaysOpenDoor' + sensor._id] = true;
           setTimeout(function(){
               if (sensor.lastValue == true) {
                   self.__controller.invokeAction('kik', 'sendMessage', ['Porte ouverte depuis une minute!!?? ' + sensor.desc, 'carlturtle37']);
                   self.__controller.addSensorValue(sensor, false);
               }
               delete self['_checkAlwaysOpenDoor' + sensor._id];
           }, 1000 * 60);
        }
    }

    updateRFSensor(clientId, topic, payLoad) {
        let self = this;
        if (payLoad.rfin) {

            let rfId = payLoad.rfin.substr(12, 5);
            if (Number(rfId)) rfId = Number(rfId);
            let foundSensor = _.find(self.node.__sensors, {name: rfId});
            if ((self.node.addNewSensor) || (foundSensor)) {
                if (foundSensor) {
                    let sensor = self.__controller.updateSensor(foundSensor, {vendor: payLoad});
                    if ((sensor.rftype == "SonoffPIR2") || (sensor.rftype == "WaterLeakSensor")){
                        self.__controller.addSensorValue(sensor, true);
                        setTimeout(function () {
                            self.__controller.addSensorValue(sensor, false);
                        }, 2500);
                    }
                    else if (sensor.rftype == "SonoffButton") {
                        if ((!sensor.debounceMs) || ((sensor.debounceMs) && (moment() - sensor.lastDate > sensor.debounceMs)))
                          self.__controller.addSensorValue(sensor, !sensor.lastValue);

                    }
                    else if (sensor.rftype == "OpenCloseSensor") {

                        if (sensor.rfIdOpen == payLoad.rfin.substr(12)) {
                            if (sensor.lastValue == true) self.__controller.addSensorValue(sensor, false);
                            self.__controller.addSensorValue(sensor, true);
                            self.checkAlwaysOpenDoor(sensor);
                        }
                        else if (sensor.rfIdClose == payLoad.rfin.substr(12)) {
                            if (sensor.lastValue == false) self.__controller.addSensorValue(sensor, true);
                            self.__controller.addSensorValue(sensor, false);
                        }
                        else if (sensor.rfIdLowBattery == payLoad.rfin.substr(12)) {
                            self.__controller.invokeAction('kik', 'sendMessage', ['DOOR SENSOR LOW BATTERY ' + sensor.desc, 'carlturtle37']);
                        }
                    }
                }
                else
                    self.__controller.addSensor({name: payLoad.rfin.substr(12, 5), vendor: payLoad}, self.node);

            }
        } else if (payLoad.app)
            self.__controller.addOrUpdateNode({id: 'openMQTTGateway'}, {
                    id: 'openMQTTGateway',
                    name: 'openMQTTGateway',
                    vendor: payLoad
                }, self,
                function (error, node) {});
    }
}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'openMQTTGateway',
        params: params,
        pluginClass: openMQTTGateway
    });
};


