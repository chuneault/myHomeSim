"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const mosca = require('mosca');

class mqttbroker extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('mqttBroker', {fileName: './logs/mqttBroker.log'});
        //self.log = params.logger.addSocket('mqttBroker', {topic: 'mqttBroker'});

        controller.addDevice(this);

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
        controller.mqttBroker = self;

        function setup() {
            self.log.info('mqtt broker server is up and running');
        }

        controller.on('loadDBCompleted', function(){

            self.server.on('clientConnected', function(client) {
                self.log.info({message: 'client connected', id: client.id});
                controller.event.emit('mqtt-newclient', client);
            });

            // fired when a message is received
            self.server.on('published', function(packet, client) {
                self.log.info({topic: packet.topic, payload: packet.payload.toString(), clientId: client ? client.id : 'null'});
                controller.event.emit('mqtt-published', packet, client);
            });
        });
    };
}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'mqttbroker',
        params: params,
        pluginClass: mqttbroker
    });
};


