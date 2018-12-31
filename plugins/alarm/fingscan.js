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
            setTimeout(function () {
                self.checkHome(true);
            }, 30 * 1000); // 30 secondes after reboot

        });
    };

    scanIp() {
        let self = this;
        self.log.info('Fing Scan Devices');

        fing.scan('-r1').then(function (responses) {
            //console.log('fing scan response', response);
            self.__controller.addOrUpdateNode({id: self.params.id},
                {id: self.params.id, name: 'fing'}, self,
                function (error, node) {
                    _.forEach(responses, function (response) {
                        _.forEach(response.Hosts, function (host) {
                            let sensor = _.find(node.__sensors, {vendor: {HardwareAddress: host.HardwareAddress}});
                            if ((sensor == null) || (sensor.id != host.Address) || (sensor.vendor.Vendor != host.Vendor)) {
                                self.log.info('Update Device', host.Address);
                                if (sensor != null)
                                    self.__controller.updateSensor(sensor, {
                                        id: host.Address,
                                        plugin: 'fing',
                                        vendor: host,
                                        name: host.Address
                                    });
                                else
                                  self.__controller
                                    .addOrUpdateSensor({id: host.Address, plugin: 'fing'},
                                        {
                                            id: host.Address,
                                            plugin: 'fing',
                                            vendor: host,
                                            name: host.Address
                                        }, node,
                                        function (err) {
                                            if (err) self.log.error(err);
                                        }
                                    );
                            }
                        })
                    })
                });

            setTimeout(function () {
                self.scanIp();
            }, 300000); // 5 minutes

        });
    };

    checkHome(firstCheck){
        let self = this;
        let deviceSensors = _.filter(self.__controller.sensors, { plugin: 'fing', checkPresence: {active: true}});

        if (deviceSensors) {
            let ips = _.map(deviceSensors, 'id');
            fing.ping(ips).then(function (response) {

                _.forEach(deviceSensors, function(sensor) {
                    let ping = _.find(response, {host: sensor.id});
                    let isAlive = !((!ping) || (ping.loss==100));
                    if ((!sensor.fingCheckCount) || (sensor.lastValue == isAlive))
                        sensor.checkCount = 0;

                    if (sensor.lastValue != isAlive) {

                        self.log.info(`ping [${ping.loss}]`, ping);

                        if ((isAlive == false) && (sensor.fingCheckCount < 1)) {
                            sensor.fingCheckCount=sensor.fingCheckCount+1;
                        }
                        else
                        {
                            sensor.fingCheckCount = 0;
                            console.log('fing ping sensor', ping, sensor.lastValue);
                            self.__controller.addSensorValue(sensor, isAlive);
                            if (firstCheck == false) {
                                self.__controller.invokeAction('castwebapi', 'TTS', ['bureau', sensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 50]);
                                self.__controller.invokeAction('kik', 'sendMessage', [sensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 'carlturtle37']);
                            }
                        }
                    }

                });


                setTimeout(function (){
                        self.checkHome(false);
                   }, 15000);



                /*let isAlive = ((!_.isEmpty(response.Hosts) ) && (response.Hosts[0].State == 'up'));
                if ((!deviceSensor.checkCount) || (deviceSensor.lastValue == isAlive))
                    deviceSensor.checkCount = 0;
                if ((deviceSensor.lastValue != isAlive) && (deviceSensor.checkCount >= 2)) {
                    deviceSensor.checkCount = 0;
                    console.log('fing ping sensor', response.Hosts, deviceSensor.lastValue);
                    self.__controller.addSensorValue(deviceSensor, isAlive);
                    if (firstCheck == false) {
                        self.__controller.invokeAction('castwebapi', 'TTS', ['bureau', deviceSensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 50]);
                        self.__controller.invokeAction('kik', 'sendMessage', [deviceSensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 'carlturtle37']);
                    }
                } else
                    deviceSensor.checkCount = deviceSensor.checkCount  + 1;
                */
            });


        }
        else
          setTimeout(function (){
            self.checkHome(false);
          }, 30000);
    }

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'fing',
        params: params,
        pluginClass: fingScan
    });
};



