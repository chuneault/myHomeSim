const _ = require('lodash'),
      plugins = require("../../lib/hsPlugins.js"),
      assert = require('assert'),
      querystring = require('querystring'),
      fs = require('fs'),
      request = require('request');

class myGoogleAssistant extends plugins {


    constructor(controller, params) {

        super(controller, params);

        let self = this;

        self.log = params.logger.addLogger('myGoogleAssistant', {fileName: './logs/myGoogleAssistant.log'});

        const express = require('express'),
              bodyParser = require('body-parser'),
              session = require('express-session'),
              https = require('https');

        let authProvider = require('./auth-provider.js');

        let app = express();

        const { smarthome } = require('actions-on-google');

        const {actionssdk, Image} = require('actions-on-google');

        const actionsSDKApp = actionssdk({debug: false});


        // Create an app instance
        const smartHomeApp = smarthome();

        // Certificate
        const privateKey = fs.readFileSync('/etc/letsencrypt/live/huneault.ca/privkey.pem', 'utf8');
        const certificate = fs.readFileSync('/etc/letsencrypt/live/huneault.ca/cert.pem', 'utf8');
        const ca = fs.readFileSync('/etc/letsencrypt/live/huneault.ca/chain.pem', 'utf8');

        const options = {
            key: privateKey,
            cert: certificate,
            ca: ca
        };

        self.getGoogleAssistantSensor = async function() {
            let result = [];

            let sensors = _.filter(controller.sensors, function(sensor) {
                return sensor['google-smarthome'] != null;});

            _.forEach(sensors, function(sensor, index){

                let sensorSmart = sensor["google-smarthome"];
                let device = {};

                device.id = sensor._id;
                if (sensorSmart.type == 'SWITCH') {
                    device.traits = ['action.devices.traits.OnOff'];
                    device.type = 'action.devices.types.OUTLET';
                }
                else
                if (sensorSmart.type == 'THERMOSTAT') {
                    device.type = 'action.devices.types.THERMOSTAT';
                    device.traits = ['action.devices.traits.TemperatureSetting'];

                    device.attributes = {
                        availableThermostatModes: "off",
                        thermostatTemperatureUnit: "C"
                    };


                }

                device.name = {};
                device.name.defaultNames = [sensorSmart.name];
                device.name.name = sensorSmart.name;

                if (_.isArray(sensorSmart.nicknames))
                   device.name.nicknames = sensorSmart.nicknames;
                else
                  device.name.nicknames = [sensorSmart.nicknames];

                device.willReportState = false;
                device.roomHint = sensorSmart.roomHint;

                //device.deviceInfo = {manufacturer: 'myHomeSim', model: "hs1234", hwVersion: "3.2",
                //    swVersion: "11.4"};


                //device.customData =  {};

                result.push(device);

            });

            //self.log.info(result);
            return result;



            /*return [
                {
                    "id": "123",
                    "type": "action.devices.types.OUTLET",
                    "traits": [
                        "action.devices.traits.OnOff"
                    ],
                    "name": {
                        "defaultNames": ["My Outlet 1234"],
                        "name": "Night light",
                        "nicknames": ["wall plug"]
                    },
                    "willReportState": false,
                    "roomHint": "kitchen",
                    "deviceInfo": {
                        "manufacturer": "lights-out-inc",
                        "model": "hs1234",
                        "hwVersion": "3.2",
                        "swVersion": "11.4"
                    },
                    "customData": {
                        "fooValue": 74,
                        "barValue": true,
                        "bazValue": "foo"
                    }
                }

            ];*/
        };

        self.getDeviceStatus = function(id) {
          let sensor = controller.sensors[id];
          if (sensor) {
              if (sensor['google-smarthome'].type == 'SWITCH')
                return {online: true, on: sensor.lastValue};
              else
                if (sensor['google-smarthome'].type == 'THERMOSTAT') {
                    return {
                        online: true, thermostatMode: 'heat',
                        thermostatTemperatureSetpoint: sensor.lastValue,
                        thermostatTemperatureAmbient: sensor.lastValue
                        //thermostatHumidityAmbient: 45.3
                    };
                }
          }
           else
              return {online: false, on: false};

        };

        self.executeCommand = function(id, command) {
            let sensor = controller.sensors[id];
            if (sensor) {
                if (command.command == 'action.devices.commands.OnOff') {
                    command.params.on ? sensor.turnOn() : sensor.turnOff();
                    return {ids: [id], status: "SUCCESS ", states: {on: command.params.on, online: true}};
                } else
                    return {ids: [id], status: "ERROR", errorCode: "unkownCommand"};
            }
            else
                return {ids: [id], status: "ERROR", errorCode: "unkownSensor"};

        };

        smartHomeApp.onSync(async (body, headers) => {
            let requestId = body.requestId;
            let result = {
                requestId: requestId,
                payload: {
                    "agentUserId": "1836.15267389",
                    "devices": await self.getGoogleAssistantSensor()
                }
            };

            self.log.debug('onSync result', JSON.stringify(result));
            return result;

        });

        smartHomeApp.onQuery(async (body, headers) => {
            let requestId = body.requestId;
            self.log.debug('onQuery', JSON.stringify(body));

            let devicesStatus = {};

            _.forEach(body.inputs[0].payload.devices, function(device) {
                devicesStatus[device.id] = self.getDeviceStatus(device.id);
            });

            let result = {
                requestId: requestId,
                payload: {devices: devicesStatus}

            };
            self.log.debug('result', JSON.stringify(result));
            return result;
        });

        smartHomeApp.onExecute(async (body, headers) => {
            console.log(JSON.stringify(headers));
            let requestId = body.requestId;
            self.log.debug('onExecute', JSON.stringify(body));

            let devicesCommands = [];
            _.forEach(body.inputs[0].payload.commands[0].devices, function(device) {
                devicesCommands.push(self.executeCommand(device.id, body.inputs[0].payload.commands[0].execution[0]));
            });

            let result = {
                requestId: requestId,
                payload: {commands: devicesCommands}

            };

            self.log.debug('result', JSON.stringify(result));
            return result;
        });


        /*********************************************************************************/

        actionsSDKApp.intent('actions.intent.MAIN', (conv) => {
            conv.ask('Salut!');
            conv.ask(new Image({
                url: 'http://home.huneault.ca:8037/img/mamaison.jpg',
                alt: 'Mamaison'
            }))
        });


         function handleTextIntent(conv, input) {
            if (input === 'bye' || input === 'goodbye')
                return conv.close('À la prochaine!');
            else {
                return new Promise(function( resolve, reject ){
                  request({url: 'http://127.0.0.1:8080/api/query/"'+input+'"', method: 'GET'},
                      function (error, response, body) {
                          if (error) {
                              conv.ask('Désolé mais je n\'ai pas compris, ' + body);
                              reject();
                          }
                          else {
                              conv.ask(body);
                              resolve();
                          }
                      }
                  )
                })
            }
        }

        actionsSDKApp.intent('actions.intent.TEXT', handleTextIntent);

        controller.on('loadDBCompleted', function () {

            _.forEach(self.params.interactions, function(interaction){
                controller.plugins['httpServer'].generateInteraction(interaction);
            });

            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({extended: true}));
            app.use(session({
                genid: function (req) {
                    return authProvider.genRandomString()
                },
                secret: 'xyzsecret',
                resave: false,
                saveUninitialized: true,
                cookie: {secure: true}
            }));

            const appPort = "443";

            app.post('/smart', smartHomeApp);
            app.post('/sdk', actionsSDKApp);

            https.createServer(options, app).listen(appPort, function(){
                self.log.info("myGoogleAssistant listening on port " + appPort);
                authProvider.registerAuth(app);
            });


        });

    }
}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'myGoogleAssistant',
        params: params,
        pluginClass: myGoogleAssistant
    });
};



