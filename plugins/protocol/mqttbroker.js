"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const mosca = require('mosca');

class mqttBroker extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('mqttBroker', {fileName: './logs/mqttBroker.log'});

        let moscaSettings = {
            port: 1883//,
            /*backend: ascoltatore,
            persistence: {
              factory: mosca.persistence.Mongo,
              url: 'mongodb://localhost:27017/mqtt'
            }*/
        };

        let server = new mosca.Server(moscaSettings);

        self.server = server;
        server.on('ready', setup);

        function setup() {
            self.log.info('Mosca server is up and running');
        }

        controller.addDevice(this);

        controller.on('loadDBCompleted', function(){

            self.server.on('clientConnected', function(client) {
                self.log.info('client connected', client.id);
            });

            // fired when a message is received
            self.server.on('published', function(packet, client) {
                /*if (client && client.id)
                    console.log(client.id);*/
                self.log.info('Published', packet.topic, packet.payload.toString());

            });

            /*self.api = new hueApi(self.params.host, self.params.userName);
            self.api.lights(function(err, lights) {
                if (err) throw err;
                self.registerLights(lights);
            });*/
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
        name: 'mqttBroker',
        params: params,
        pluginClass: mqttBroker
    });
};


