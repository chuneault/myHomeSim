"use strict";

const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const unirest = require('unirest');


class sengled extends plugins {

    constructor(controller, params) {

        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('sengled', {fileName: './logs/sengled.log'});

        controller.addDevice(this);

        self._client = {cookie: unirest.jar()};

        controller.on('loadDBCompleted', function () {

            self.login(self.params.userName, self.params.password, function(error, info){
                if (info) {
                    self.log.info(info);
                    self._client.jsessionid = info.jsessionid;
                    self.__controller.addOrUpdateNode({id: 'sengled'},
                        {id: 'sengled', name: 'sengled', vendor: info}, self,
                        function (error, node) {


                            node.refresh = function() {
                                let node = this;
                                self.getDevicesList(function(error, devices){
                                    _.forEach(devices.gatewayList[0].deviceList, function(device){
                                        self.__controller.addOrUpdateSensor({nodeId: node._id, name: device.deviceName}, {
                                                name: device.deviceName, vendor: device,
                                                functionType: [self.__controller.sensorFunctionType.switch /*, self.__controller.sensorFunctionType.brightness*/],
                                                stateOn: device.onoff != 0}, node,
                                            function (err, sensor) {
                                                if (sensor.lastValue != sensor.stateOn)
                                                    self.__controller.addSensorValue(this, sensor.stateOn);
                                            });
                                    });
                                });
                            };


                            self.getDevicesList(function(error, devices){
                                //console.log(devices);
                                _.forEach(devices.gatewayList[0].deviceList, function(device){

                                    let functionType;
                                    if (device.productCode == 'E11-G13') {
                                        functionType = [self.__controller.sensorFunctionType.switch, self.__controller.sensorFunctionType.brightness];
                                    }
                                    else
                                    if (device.productCode == 'Z01-A19') {
                                        functionType = [self.__controller.sensorFunctionType.switch,
                                            self.__controller.sensorFunctionType.brightness, self.__controller.sensorFunctionType.colorTemperature]
                                    }

                                    self.__controller.addOrUpdateSensor({nodeId: node._id, name: device.deviceName}, {
                                            name: device.deviceName, vendor: device,
                                            functionType: functionType,
                                            stateOn: device.onoff != 0}, node,
                                        function (err, sensor) {
                                             let turnOnOff = function(sensor, value){
                                                 self.turnOnOff(sensor.vendor.deviceUuid, value, function(err, info){
                                                     if (info) {
                                                         self.__controller.updateSensor(sensor, {stateOn: value, stateBrigthness:  Math.trunc(info.brightness / 255 * 100) });
                                                         self.__controller.addSensorValue(sensor, value);
                                                     }
                                                 });

                                             };
                                             sensor.turnOn = function() {turnOnOff(this, true)};
                                             sensor.turnOff = function() {turnOnOff(this, false)};
                                             sensor.brightness = function(value){
                                                 let sensor = this;
                                                 self.brightness(sensor.vendor.deviceUuid, Math.trunc(value / 100 * 255), function(err, info){
                                                     if (info) {
                                                         self.__controller.updateSensor(sensor, {stateBrigthness: value});
                                                     }
                                                 });

                                             };
                                        });
                                });
                            });
                        });
                }
                 else
                   self.log.error(error, info);
            });
        });
    };

    _guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    brightness(deviceId, value, cb) {
        //"brightness": 0-255, "deviceUuid": deviceId
        let self = this;
        unirest.post(self.params.url+'/device/deviceSetBrightness.json')
            .type('json')
            .send({
                deviceUuid: deviceId,
                brightness: value
            })
            .jar(self._client.cookie)
            .end(function (response) {
                if ((response.ok) && (response.body.messageCode == '200')) {
                    self.log.info('brightness ok', response.body);
                    cb(null, response.body)
                }
                else {
                    self.log.error('brightness error', response.body);
                    cb(response.body);
                }
            });
    }

    turnOnOff(deviceId, value, cb) {
         //"onoff": onoff ? 1 : 0,"deviceUuid": deviceId
        let self = this;
        unirest.post(self.params.url+'/device/deviceSetOnOff.json')
            .type('json')
            .send({
                deviceUuid: deviceId,
                onoff: value ? 1: 0
            })
            .jar(self._client.cookie)
            .end(function (response) {
                if ((response.ok) && (response.body.messageCode == '200')) {
                    self.log.info('turnOnOff ok', response.body, 'onoff', value);
                    cb(null, response.body)
                }
                else {
                    self.log.info('turnOnOff error', response.body);
                    cb(response.body);
                }
            });
    }

    login(userName, password, cb) {
        let self = this;
        unirest.post(self.params.url+'/customer/remoteLogin.json')
            .type('json')
            .send({
                uuid: self._guid(),
                isRemote: true,
                user: userName,
                pwd: password,
                os_type: 'android'
            })
            .jar(self._client.cookie)
            .end(function (response) {
                if ((response.ok) && (response.body.msg == 'success'))
                   cb(null, response.body);
                else
                   cb(response.body);
            });

    }

    getDevicesList(cb) {
        let self = this;
        unirest.post(self.params.url+'/device/getDeviceInfos.json')
            .jar(self._client.cookie)
            .end(function (response) {
                if ((response.ok) && (response.body.messageCode == '200')) {
                    self.log.info('getDevicesList ok', response.body);
                    cb(null, response.body)
                }
                else {
                  self.log.error('getDevicesList error', response.body);
                  cb(response.body);
                }
            });
    }
}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'sengled',
        params: params,
        pluginClass: sengled
    });
};


