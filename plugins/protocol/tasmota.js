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
            }
        });
    };

    /*
    registerLights(lights) {
        let self = this;
        self.__controller.addOrUpdateNode({id: self.params.id},
            {id: self.params.id, name: self.params.name, vendor: self.params}, self,
            function (error, node) {
                if (node)
                    _.forEach(lights.lights, function(light) {
                        self.__controller.addOrUpdateSensor({nodeId: node._id, vendor: {light: {id: light.id}}},
                            {name: light.name, functionType: [self.__controller.sensorFunctionType.switch, self.__controller.sensorFunctionType.brightness],
                                stateOn: light.state.on, stateBrigthness: light.state.bri/255*100, vendor: {light}}, node,
                            function(err, sensor) {

                                sensor.__sensorApi = light;
                                sensor.turnOn = function(){
                                    self.write(this, 'on', true);
                                    self.__controller.addSensorValue(this, true);
                                    this.stateOn = true;
                                };
                                sensor.turnOff = function(){
                                    self.write(this, 'on', false);
                                    self.__controller.addSensorValue(this, false);
                                    this.stateOn = false;
                                };
                                sensor.brightness = function(value){
                                    self.write(this, 'brightness', parseInt(value));
                                    this.stateBrigthness = parseInt(value);
                                    //console.log('new stateBrigthness', this.stateBrigthness);
                                };
                            });
                    });

            }
        );
    }
*/

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


