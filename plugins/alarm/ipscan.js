const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const arpscan = require('./arpscan.js');   // perform the arp scan
const mac = require('./mac.js');
const getHostName = require('./getHostName.js');
const ping = require('ping');


class ipScan extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('ipscan', {fileName: './logs/ipscan.log'});

        controller.addDevice(this);

        controller.on('loadDBCompleted', function () {
            self.scanIp();

            setTimeout(function () {
                self.scanIp();
            }, 60000);

            self.checkHome(true);
            setInterval(function (){
                self.checkHome(false);
            }, 15000);

        });
    };

    scanIp() {
        let self = this;
        self.log.info('Scan Devices (IP)', self.params.dev);

        arpscan({dev: self.params.dev}).then(function (response) {

            self.__controller.addOrUpdateNode({id: self.params.id},
                {id: self.params.id, name: 'IPScan', dev: self.params.dev}, self,
                function (error, node) {
                    _.forEach(response, function (ip) {
                        getHostName(ip.ip).then(
                            function (nameDev) {
                                let sensor = _.find(node.__sensors, {mac: ip.mac});
                                if ((sensor == null) || ((sensor.id != ip.ip) || (sensor.name != (nameDev == '' ? ip.ip : nameDev)))) {
                                    self.log.info('Update Device', ip);
                                    self.__controller
                                        .addOrUpdateSensor({id: ip.ip},
                                            {
                                             id: ip.ip,
                                             name: (nameDev == '' ? ip.ip : nameDev),
                                             mac: ip.mac,
                                             vendorName: '(Unknown)'
                                            }, node,
                                            function (err, sensor) {
                                            }
                                        )
                                }
                                if ((sensor) && (sensor.vendorName == '(Unknown)')) {
                                    sensor.vendorName = 'Pending';
                                    mac(sensor.mac).then(function(vendor){
                                        if ((vendor != '') && (vendor != '(Unknown)')) {
                                            self.log.info('Update Device Vendor', sensor.id, vendor);
                                            self.__controller.addOrUpdateSensor({id: sensor.id}, {
                                                id: sensor.id,
                                                vendorName: vendor
                                            }, node, function (err, sensor) {
                                            });
                                        }
                                    });
                                }
                            }
                        )
                    })
                });
        });
    };

    checkHome(firstCheck){
        let self = this;
        let cfg = {
            timeout: 6,
            // WARNING: -i 2 may not work in other platform like window
            extra: ["-i 1"],
        };

        let deviceSensors = _.find(self.__controller.sensors, {checkPresence: {active: true}});
        if (deviceSensors)
            deviceSensors.forEach(function(deviceSensor){
            ping.sys.probe(deviceSensor.id, function(isAlive){
                if (deviceSensor.lastValue != isAlive) {
                    self.__controller.addSensorValue(deviceSensor, deviceSensor);
                    if (!firstCheck) {
                        self.__controller.invokeAction('castwebapi', 'TTS', ['bureau', deviceSensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 50]);
                        self.__controller.invokeAction('pushBullet', 'sendMessage', [deviceSensor.desc, isAlive ? 'vient d\'entrer à la maison' : ' est sortie de la maison']);
                    }
                    firstCheck = false;
                }
            }, cfg);
        });

    }

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'ipScan',
        params: params,
        pluginClass: ipScan
    });
};



