const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const fing = require('./fingping.js');   // perform the arp scan


class fingScan extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('ipscan', {fileName: './logs/fingScan.log'});

        controller.addDevice(this);

        controller.on('loadDBCompleted', function () {
            self.scanIp();
            //self.checkHome(true);
        });
    };

    scanIp() {
        let self = this;
        self.log.info('Scan Devices (IP)', self.params.dev);

        fing.scan().then(function (response) {

            self.__controller.addOrUpdateNode({id: self.params.id},
                {id: self.params.id, name: 'fing'}, self,
                function (error, node) {
                    _.forEach(response.Hosts, function (host) {
                        let sensor = _.find(node.__sensors, {vendor:{HardwareAddress: host.HardwareAddress}});
                        if ((sensor == null) || (sensor.id != host.Address)) {
                            self.log.info('Update Device', host);
                            self.__controller
                                .addOrUpdateSensor({id: host.Address},
                                    {
                                     id: host.Address,
                                     vendor: host
                                    }, node,
                                    function (err, sensor) {
                                    }
                                );
                        }
                    })
                });

            setTimeout(function () {
                self.scanIp();
            }, 300000); // 5 minutes

        });
    };

    checkHome(firstCheck){
        /*let self = this;
        let cfg = {
            timeout: 15,
            // WARNING: -i 2 may not work in other platform like window
            extra: ["-i 0.5"],
        };
        let deviceSensors = _.filter(self.__controller.sensors, {checkPresence: {active: true}});
        if (deviceSensors) {
            _.forEach(deviceSensors, function (deviceSensor, index) {
                ping.sys.probe(deviceSensor.id, function (isAlive) {
                    if (deviceSensor.lastValue != isAlive) {
                        console.log('ipscan sensor', deviceSensor.lastValue, isAlive);
                        self.__controller.addSensorValue(deviceSensor, isAlive);
                        if (firstCheck == false) {
                            self.__controller.invokeAction('castwebapi', 'TTS', ['bureau', deviceSensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 50]);
                            self.__controller.invokeAction('kik', 'sendMessage', [deviceSensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 'carlturtle37']);
                        }
                    }
                    if (index == deviceSensors.length-1)
                        setTimeout(function (){
                            self.checkHome(false);
                        }, 15000);
                }, cfg);

            });
        }
        else
          setTimeout(function (){
            self.checkHome(false);
          }, 30000);*/
    }

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'fing',
        params: params,
        pluginClass: fingScan
    });
};



