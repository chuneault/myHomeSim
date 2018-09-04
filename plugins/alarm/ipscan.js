const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const arpscan = require('./arpscan.js');   // perform the arp scan
const mac = require('./mac.js');
const getHostName = require('./getHostName.js');


class ipScan extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('ipscan', {fileName: './logs/ipscan.log'});

        controller.addDevice(this);

        controller.on('loadDBCompleted', function () {
            self.scanIp();
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
                                if ((sensor == null) || ((sensor.id != ip.ip) || (sensor.name != (nameDev == '' ? ip.ip : nameDev)) || ((sensor.vendorName != ip.vendor) && (ip.vendor != '(Unknown)')))) {
                                    self.log.info('Update Device', ip);
                                    self.__controller
                                        .addOrUpdateSensor({id: ip.ip},
                                            {
                                                id: ip.ip,
                                                name: (nameDev == '' ? ip.ip : nameDev),
                                                mac: ip.mac,
                                                vendorName: ip.vendor
                                            }, node,
                                            function (err, sensor) {
                                            }
                                        )

                                }
                                if ((sensor) && (sensor.vendorName == '(Unknown)'))
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
                        )
                    })
                });

            setTimeout(function () {
                self.scanIp();
            }, 60000);

        });
    };

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'ipScan',
        params: params,
        pluginClass: ipScan
    });
};



