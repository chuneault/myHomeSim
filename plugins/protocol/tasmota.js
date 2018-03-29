"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');

class tasmota extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('tasmota', {fileName: './logs/tasmota.log'});

        self.clients = {};

        controller.on('mqtt-newclient', function(client){
            //if tasmota client //todo
            self.clients[client.id] = client;
            self.log.info('new tasmota client', client.id);

        });

        controller.on('mqtt-published', function(packet, client){
            if (client && client.id && self.clients[client.id]){
                self.log.info('tasmota client published', client.id, packet.topic, packet.payload.toString());

                if (_.endsWith(packet.topic, 'SENSOR'))
                    self.updateTasmotaSensor(client.id, packet.topic, packet.payload.toSource());
                else
                  if (_.endsWith(packet.topic, 'STATE'))
                      self.updateTasmotaState(client.id, packet.topic, packet.payload.toSource());
                  else
                    if (_.endsWith(packet.topic, 'POWER'))
                        self.updateTasmotaState(client.id, packet.topic, '{"POWER": "'+ packet.payload.toSource() +'"}');

            }
        });


    };

    //Published tele/aquatempswitch/SENSOR {"Time":"2018-03-28T15:49:37","DS18B20":{"Temperature":24.4},"TempUnit":"C"}
    updateTasmotaSensor(clientId, topic, payload) {
        let self = this;
        let jsonPayload = JSON.parse(payload);
        let topics = topic.split('/');
        self.__controller.addOrUpdateNode({id: clientId},
            {id: clientId, name: topics[1]}, self,
            function (error, node) {
                if (node) {
                    if (jsonPayload.DS18B20)
                        self.__controller.addOrUpdateSensor({name: 'DS18B20'}, {
                              name: 'DS18B20', functionType: [self.__controller.sensorFunctionType.temperature],
                                Temperature: jsonPayload.DS18B20.Temperature, tempUnit: jsonPayload.TempUnit}, node,
                            function (err, sensor) {
                            });

                }
            }
        );
    }

    //Published tele/aquatempswitch/STATE {"Time":"2018-03-28T15:49:37","Uptime":"0T00:00:20","Vcc":3.422,"POWER":"ON","Wifi":{"AP":1,"SSId":"chalwifi","RSSI":48,"APMac":"04:BF:6D:57:7B:74"}}
    updateTasmotaState(clientId, topic, payload) {
        let self = this;
        let jsonPayload = JSON.parse(payload);
        let topics = topic.split('/');
        self.__controller.addOrUpdateNode({id: clientId},
            {id: clientId, name: topics[1], vendor: jsonPayload}, self,
            function (error, node) {
                if (node) {
                    if (jsonPayload.POWER)
                        self.__controller.addOrUpdateSensor({name: 'POWER'}, {
                                name: 'POWER', functionType: [self.__controller.sensorFunctionType.switch],
                                stateOn: jsonPayload.POWER}, node,
                            function (err, sensor) {

                                //sensor.__sensorApi = light;
                                sensor.turnOn = function(){
                                    //self.write(this, 'on', true);
                                    self.__controller.addSensorValue(this, true);
                                    this.stateOn = true;
                                };
                                sensor.turnOff = function(){
                                    //self.write(this, 'on', false);
                                    self.__controller.addSensorValue(this, false);
                                    this.stateOn = false;
                                };

                            });

                }
            }
        );
    }


    write(sensor, msgType, msgVal) {
        /*var self = this;
        let state = hue.lightState.create();
        state[msgType](msgVal);
        self.api.setLightState(sensor.vendor.light.id, state)
            .then(function(result){})
            .catch(function(e) {
                console.log('error api philips hue', e); // "zut !"
            })
            .done();*/
    }

    send(node, sensor, msgType, msgVal) {
        //this.write(sensor, msgType, msgVal);
    }
}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'tasmota',
        params: params,
        pluginClass: tasmota
    });
};


