const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const arpscan = require('./arpscan.js');   // perform the arp scan
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
        self.log.info('Scan IP');

        arpscan({dev: "eth0"}).then(function (response) {

            self.__controller.addOrUpdateNode({id: ip.ip},
                {name: 'IPDevices', dev: 'eth0'}, self,
                function (error, node) {
                    _.forEach(response, function (ip) {
                        getHostName(ip.ip).then(
                            function (name) {
                                self.__controller
                                    .addOrUpdateSensor({id: ip.ip},
                                        {
                                          id: ip.ip, name: name,
                                          mac: ip.mac
                                        }, node,
                                        function (err, sensor) {


                                        }
                                    )
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



