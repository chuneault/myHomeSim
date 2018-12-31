const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const nmap = require('node-nmap');   // perform the nmap scan
const moment = require('moment');
const wol = require('wol');
const request = require('request');
const ping = require('ping');

class nmapScan extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('nmapscan', {fileName: './logs/nmapscan.log'});
        //self.log = params.logger.addLoggerMemory('nmapscan');

        controller.addDevice(this);

        controller.on('loadDBCompleted', function () {

            self.__controller.addOrUpdateNode({id: self.params.id},
                {id: self.params.id, name: 'nmapScan'}, self,
                function (error, node) {
                   self.node = node;
                    self.__controller
                        .addOrUpdateSensor({id: 'atHomeCount', plugin: 'nmapScan'},
                            {
                                id: 'atHomeCount',
                                plugin: 'nmapScan',
                                name: 'Person Home Count'
                            }, self.node,
                            function (err, sensor) {
                                if (err) self.log.error(err);
                                self.atHomeCountSensor = sensor;

                                self.scanIp();
                                setTimeout(function () {
                                    self.checkHome(true,  Date.now() + 60000); //vérifie pendant 1 minute
                                }, 30 * 1000); // 30 secondes after reboot
                                setTimeout(function () {
                                    self.checkDevices();
                                }, 1000*10);


                            }, false
                        );
                }, false);
        });
    };

    scanIp() {
        let self = this;
        self.log.info('nmap Scan Devices');

        let nmapscan = new nmap.QuickScan(self.params.ip+'/24', '-sP');

        nmapscan.on('complete', function(data) {
            _.forEach(data, function (host) {
                let sensor = _.find(self.node.__sensors, {vendor: {mac: host.mac}});
                if ((sensor == null) || (sensor.id != host.ip) || (sensor.vendor.Vendor != host.vendor)) {
                    self.log.info('Update Device', host.ip);
                    if (sensor != null) {
                        self.__controller.updateSensor(sensor, {
                            id: host.ip,
                            plugin: 'nmapScan',
                            vendor: host,
                            name: host.ip
                        }, false);
                        if ((sensor.WOL) && (!sensor.turnOn)) {
                            self.log.info('Add WOL fonction', host.ip);
                            sensor.turnOn = function () {
                                self.log.info('Call WOL', this.desc);
                                wol.wake(this.vendor.mac, function(err, res){
                                    self.log.info(res);
                                });
                            };

                            sensor.turnOff = function () {
                                self.log.info('Call stop-server Sleep', this.desc);
                                request({url: 'http://' + this.vendor.ip + ':5709/sleep', encoding: null, method: 'POST'},
                                    function (error, response, body) {
                                        console.log(response);
                                    }
                                );
                            };

                        }
                    } else
                        self.__controller
                            .addOrUpdateSensor({id: host.ip, plugin: 'nmapScan'},
                                {
                                    id: host.ip,
                                    plugin: 'nmapScan',
                                    vendor: host,
                                    name: host.ip
                                }, self.node,
                                function (err) {
                                    if (err) self.log.error(err);
                                }, false
                            );
                }

            })
        });

        nmapscan.on('error', function(error){
            self.log.error(error);
        });

        nmapscan.startScan();

        setTimeout(function () {
            self.scanIp();
        }, 300000 * 3); // 15 minutes

    };


    checkDevices() {
        let self = this;
        let devicesToCheck = _.filter(self.node.__sensors, {
            plugin: 'nmapScan', checkPresence: {active: true, type: "computer"}
        });
        
        if ((devicesToCheck) && (devicesToCheck.length > 0)) {
            devicesToCheck.forEach(function(sensor){
                ping.sys.probe(sensor.id, function(isAlive){
                    if (sensor.lastValue != isAlive) {
                        self.__controller.addSensorValue(sensor, isAlive);
                        self.__controller.invokeAction('kik', 'sendMessage', [sensor.desc + (isAlive ? ' est maintenant ouvert' : ' est maintenant fermé'), 'carlturtle37']);
                    }
                });
            });
            setTimeout(function () { self.checkDevices(); }, 1000); // 1 minute

        } else
            setTimeout(function () {
                self.checkDevices();
            }, 5000*60); // 5 minute

    }

    checkHome(firstCheck, endTimeToCheck, complete){
        this.__controller.vars.nmapScanCheckHomeRunning = true;
        let self = this;
        let deviceSensors = _.filter(self.node.__sensors, { plugin: 'nmapScan', checkPresence: {active: true, type: "phone"}});

        let personPhoneCount  = deviceSensors.length;

        deviceSensors = _.filter(deviceSensors, function(sensor) {
          let needToCheck =  (!sensor.__nextCheckDevieTime) || (sensor.__nextCheckDevieTime <=  Date.now());

          if ((needToCheck) && (sensor.checkPresence.noCheckSchedule))
              needToCheck = moment(sensor.checkPresence.noCheckSchedule.from, 'HH:mm').isAfter(moment()) || moment(sensor.checkPresence.noCheckSchedule.to, 'HH:mm').isAfter(moment());


          /*
          21:00 > 22H00 F || 7:00 > 22H00  F = F
          21:00 > 8:00 V || 7:00 > 8:00  F = V
          21:00 > 17:00 V || 7:00 > 17:00 F = V
          21:00 > 21:00 F || 7:00 > 11:00 F = F
          21:00 > 21:05 F || 7:00 > 21:05 F = F
          21:00 > 7:01 V || 7:00 > 7:01 F = V

            */

          if ((needToCheck == false) && (sensor.lastValue == false))
              personPhoneCount  -= 1;
          return needToCheck;
        });


        if ((deviceSensors) && (deviceSensors.length > 0)) {
            let ips = _.map(deviceSensors, 'id');

            let nmapscan = new nmap.QuickScan(ips, '-n -p 80');

            nmapscan.on('complete', function(response) {

                _.forEach(deviceSensors, function (sensor, index) {
                    let isAlive = !(_.isEmpty(_.find(response, {ip: sensor.id})));

                    //self.log.info('check presence', sensor.desc, sensor.id, sensor.lastValue, isAlive, sensor.__checkNotPresentCount, moment(endTimeToCheck).format('h:mm:ss a'));

                    if (firstCheck)
                        sensor.__checkNotPresentCount = 0;

                    if (sensor.lastValue == isAlive) {

                        sensor.__checkNotPresentCount = 0;
                        if (isAlive) {
                            sensor.__nextCheckDevieTime = Date.now() + 15000; //vérifier dans 15 secondes s'il est présent
                        }
                       else {
                            sensor.__nextCheckDevieTime = Date.now() + 2000;
                            personPhoneCount  -= 1;
                        }
                    }
                    else {

                        if ((isAlive == false) && (sensor.__checkNotPresentCount < sensor.checkPresence.maxNotPresentCount )) {
                            sensor.__checkNotPresentCount += 1;
                            sensor.__nextCheckDevieTime = Date.now() + 2000;
                        }
                        else {
                            self.__controller.addSensorValue(sensor, isAlive);
                            sensor.__nextCheckDevieTime = Date.now() + 15000;
                            sensor.__checkNotPresentCount = 0;
                            if (firstCheck == false) {
                                self.__controller.invokeAction('castwebapi', 'TTS', ['bureau', sensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 50]);
                                self.__controller.invokeAction('kik', 'sendMessage', [sensor.desc + (isAlive ? ' vient d\'entrer à la maison' : ' est sortie de la maison'), 'carlturtle37']);
                            }
                            if (isAlive == false)
                                personPhoneCount  -= 1;
                        }
                    }


                    if (index == deviceSensors.length-1) {
                        if (self.atHomeCountSensor.lastValue != personPhoneCount ) {
                            console.log('count de présence', personPhoneCount );
                            self.__controller.addSensorValue(self.atHomeCountSensor, personPhoneCount);
                        }
                    }

                });

                if (endTimeToCheck > Date.now())
                  setTimeout(function (){
                      self.checkHome(false, endTimeToCheck);
                  }, 2000);
                else {

                    self.__controller.vars.nmapScanCheckHomeRunning = false;
                    if (complete) complete();
                }

            });

            nmapscan.on('error', function(error){
                self.log.error(error);
            });

        }
        else
          if (endTimeToCheck > Date.now())
            setTimeout(function (){
                self.checkHome(false);
            }, 30000);
          else {
              self.__controller.vars.nmapScanCheckHomeRunning = false;
              if (complete) complete();
          }

    }

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'nmap',
        params: params,
        pluginClass: nmapScan
    });
};



