"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');

class espurna extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('espurna', {fileName: './logs/espurna.log'});

        controller.addDevice(this);

        self.clients = {};

        controller.on('loadDBCompleted', function () {

            controller.on('mqtt-newclient', function (client) {
                if (_.startsWith(client.id, 'ESPURNA')) {
                    self.clients[client.id] = client;
                    self.log.info('New ESPURNA Client', client.id);
                }

            });

            controller.on('mqtt-published', function (packet, client) {

                if (client && client.id && (_.startsWith(client.id, 'ESPURNA'))) {

                    if (!self.clients[client.id]) self.clients[client.id] = client;

                    if (_.endsWith(packet.topic, '/data'))
                        self.updateESPURNASensor(client.id, packet.topic, packet.payload.toString());
                    /*else if (_.endsWith(packet.topic, 'INFO1') || _.endsWith(packet.topic, 'INFO2'))
                        self.updateTasmotaState(client.id, packet.topic, packet.payload.toString());*/
                }
            });

        });
    };

    getClientInfo(IPAddress, callback) {
        let self = this;
        let unirest = require('unirest');
        unirest.get('http://'  + IPAddress  + '/cm?cmnd=Status 0')
            .end(function (resp) {
                callback(null, resp.body);
            })
    }


    //Published tele/aquatempswitch/SENSOR {"Time":"2018-03-28T15:49:37","DS18B20":{"Temperature":24.4},"TempUnit":"C"}
    updateESPURNASensor(clientId, topic, payload) {
        let self = this;
        let jsonPayload = JSON.parse(payload);

        if (jsonPayload.app) {
            self.__controller.addOrUpdateNode({id: clientId},
                {id: clientId, name: jsonPayload.host, vendor: jsonPayload}, self,
                function (error, node) {}
            );

        }
        else
        self.__controller.addOrUpdateNode({id: clientId},
            {id: clientId, name: jsonPayload.host}, self,
            function (error, node) {
                if (node) {
                    if (jsonPayload.temperature)
                        self.__controller.addOrUpdateSensor({nodeId: node._id, name: 'temperature'}, {
                              name: 'temperature', functionType: [self.__controller.sensorFunctionType.temperature],
                                Temperature: jsonPayload.temperature}, node,
                            function (err, sensor) {
                                self.__controller.addSensorValue(sensor, jsonPayload.temperature);
                            });

                }
            }, false
        );
    }

    //Published tele/aquatempswitch/STATE {"Time":"2018-03-28T15:49:37","Uptime":"0T00:00:20","Vcc":3.422,"POWER":"ON","Wifi":{"AP":1,"SSId":"chalwifi","RSSI":48,"APMac":"04:BF:6D:57:7B:74"}}
    updateTasmotaState(clientId, topic, payload) {
        let self = this;
        let jsonPayload = JSON.parse(payload);

        if ((_.endsWith(topic, 'INFO2')) && (jsonPayload.IPAddress)) {
            self.getClientInfo(jsonPayload.IPAddress,
                function(err, info){
                    self.__controller.addOrUpdateNode({id: clientId},
                        {id: clientId, name: topics[1], vendor: info}, self,
                        function (error, node) {

                        });
                });
        }

        let topics = topic.split('/');
        self.__controller.addOrUpdateNode({id: clientId},
            {id: clientId, name: topics[1], vendor: jsonPayload}, self,
            function (error, node) {
                if (node) {
                    if (jsonPayload.POWER)
                        self.__controller.addOrUpdateSensor({nodeId: node._id, name: 'POWER'}, {
                                name: 'POWER', functionType: [self.__controller.sensorFunctionType.switch],
                                stateOn: jsonPayload.POWER == 'ON'}, node,
                            function (err, sensor) {
                                self.__controller.addSensorValue(sensor, jsonPayload.POWER == 'ON');
                                if (!sensor.turnOn)
                                  sensor.turnOn = function(){
                                    self.write(this, 'power', 'ON');
                                    self.__controller.addSensorValue(this, true);
                                    this.stateOn = true;
                                };
                                if (!sensor.turnOff)
                                  sensor.turnOff = function(){
                                    self.write(this, 'power', 'OFF');
                                    self.__controller.addSensorValue(this, false);
                                    this.stateOn = false;
                                };

                            });

                }
            }
        );
    }

    /*write(sensor, cmd, cmdVal) {
        this.__controller.mqttBroker.server.publish({
            topic: 'cmnd/'+sensor.__ownerNode.name+'/'+cmd,
            payload: cmdVal, // or a Buffer
            qos: 0, // 0, 1, or 2
            retain: false // or true
        });
    }*/

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'espurna',
        params: params,
        pluginClass: espurna
    });
};

