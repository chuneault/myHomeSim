const _ = require('lodash'),
      plugins = require("../../lib/hsPlugins.js"),
      assert = require('assert'),
      querystring = require('querystring'),
      fs = require('fs');

class myGoogleAssistantSDK extends plugins {


    constructor(controller, params) {

        super(controller, params);

        let self = this;

        self.log = params.logger.addLogger('myGoogleAssistantSDK', {fileName: './logs/myGoogleAssistantSDK.log'});

        const express = require('express'),
              bodyParser = require('body-parser'),
              session = require('express-session'),
              https = require('https');

        let authProvider = require('./auth-provider.js');

        let app = express();

        const {actionssdk, Image} = require('actions-on-google');

        const actionsSDKApp = actionssdk({debug: true});

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

        actionsSDKApp.intent('actions.intent.MAIN', (conv) => {
            conv.ask('Salut!');
            conv.ask(new Image({
                url: 'https://i2.wp.com/devotics.fr/wp-content/uploads/2017/08/cropped-logo-tranparent' +
                    '-400x434-1.png?fit=400%2C438&ssl=1',
                alt: 'Devotics'
            }))
        });


        function handleTextIntent(conv, input) {
            if (input === 'bye' || input === 'goodbye')
               return conv.close('See you later!');
            else
            if (input === 'Allume la lampe') {
                conv.ask('Comme si c\'était fait!');
            } else {
                conv.ask('Désolé mais je n\'ai pas compris.');
            }
        }

        actionsSDKApp.intent('actions.intent.TEXT', handleTextIntent);


        controller.on('loadDBCompleted', function () {

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

            const appPort = "3000";

            app.post('/sdk', actionsSDKApp);

            https.createServer(options, app).listen(appPort, function(){
                self.log.info("Express server listening on port " + appPort);
                authProvider.registerAuth(app);
            });


        });

    }
}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'myGoogleAssistantSDK',
        params: params,
        pluginClass: myGoogleAssistantSDK
    });
};



