"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const mosca = require('mosca');

class mqttbroker extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('mqttBroker', {fileName: './logs/mqttBroker.log'});

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

        function setup() {
            self.log.info('mqtt broker server is up and running');
        }

        controller.on('loadDBCompleted', function(){

            self.server.on('clientConnected', function(client) {
                self.log.info('client connected', client.id);
                controller.event.emit('mqtt-newclient', client);
            });

            // fired when a message is received
            self.server.on('published', function(packet, client) {
                /*if (client && client.id)
                    console.log(client.id);*/
                //self.log.info('Published', packet.topic, packet.payload.toString());
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


