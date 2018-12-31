"use strict";

const plugins = require("../../lib/hsPlugins.js");
const huejay = require('huejay');
const _       = require('lodash');

class huejayPlugin extends plugins {

  constructor(controller, params) {
    super(controller, params);
    let self = this;
    self.log = params.logger.addLogger('huejay', {fileName: './logs/huejay.log'});

    controller.addDevice(this);

    controller.on('loadDBCompleted', function(){
        self.log.info('Discover Philips Hue Bridge');

        huejay.discover()
            .then(bridges => {
                for (let bridge of bridges) {
                    self.log.info(`Found Philips Hue Bridge Id: ${bridge.id}, IP: ${bridge.ip}`);
                    self.clientHue = new huejay.Client({
                        host:     bridge.ip,
                        port:     80,
                        username: self.params.userName,
                        timeout:  15000, // Optional, timeout in milliseconds (15000 is the default)
                    });

                    self.__controller.addOrUpdateNode({id: bridge.id},
                        {id: bridge.id, name: 'Philips Hue Bridge', vendor: bridge}, self,
                         function (err, node) {
                             if (err) self.log.error(err);
                             self.registerLights(self.clientHue, node);
                             self.registerGroups(self.clientHue, node);
                             node.refresh = function(){
                                 self.refreshDevice(node);
                             };

                         });
                }
            })
            .catch(error => {
                self.log.error(`An error occurred: ${error.message}`);
            });
    });
  };

  refreshDevice(node) {
      let self = this;
      //self.log.info(`Refresh Philips Device: ${self.name}`);
      _.forEach(node.__sensors , function(sensor){
          if (sensor.refresh) {
              //self.log.info(`Refresh Philips Sensor: ${sensor.name}`);
              sensor.refresh();
          }
      });
  }

  registerLights(client, node) {
     let self = this;
     client.lights.getAll()
          .then(lights => {
              for (let light of lights) {
                  self.log.info(`Found Philips Light: ${light.name}, id: ${light.id}`);
                  self.__controller.addOrUpdateSensor({id: light.uniqueId, hueType: 'light'},
                      {id: light.uniqueId, hueType: 'light', lightId: light.attributes.attributes.id, name: light.name, functionType: [self.__controller.sensorFunctionType.switch, self.__controller.sensorFunctionType.brightness],
                          stateOn: light.on, stateBrigthness: Math.trunc(light.brightness * 100 / 254), vendor: {light}}, node,
                      function(err, sensor) {
                         if (err) self.log.error(err);

                         sensor.updateLight = function(on, brightness) {
                             client.lights.getById(this.lightId)
                                 .then(light => {
                                     if (brightness != null)
                                       light.brightness = Math.trunc(brightness * 254 / 100);
                                     if (on != null)
                                       light.on = on;
                                     return client.lights.save(light);
                                 })
                                 .then(light => {
                                     self.log.info(`Updated light [${light.id}]`);
                                 })
                                 .catch(error => {
                                     cself.log.error(error.stack);
                                 });
                         };

                         sensor.refresh = function(){
                           let sensor = this;
                           client.lights.getById(this.lightId)
                               .then(light => {
                                     self.__controller.updateSensor(sensor, {name: light.name,
                                         stateOn: light.on, stateBrigthness: Math.trunc(light.brightness * 100 / 254), vendor: {light}});
                                     self.__controller.addSensorValue(sensor, light.on);
                                });
                         };

                         sensor.turnOn = function(){
                              this.updateLight(true, null);
                              this.stateOn = true;
                              self.__controller.addSensorValue(this, true);
                          };
                          sensor.turnOff = function(){
                              this.updateLight(false, null);
                              this.stateOn = false;
                              self.__controller.addSensorValue(this, false);
                          };
                          sensor.brightness = function(value){
                              this.updateLight(null, parseInt(value));
                              this.stateBrigthness = parseInt(value);
                          };
                      });

                  /*console.log(`Light [${light.id}]: ${light.name}`);
                  console.log(`  Type:             ${light.type}`);
                  console.log(`  Unique ID:        ${light.uniqueId}`);
                  console.log(`  Manufacturer:     ${light.manufacturer}`);
                  console.log(`  Model Id:         ${light.modelId}`);
                  console.log('  Model:');
                  console.log(`    Id:             ${light.model.id}`);
                  console.log(`    Manufacturer:   ${light.model.manufacturer}`);
                  console.log(`    Name:           ${light.model.name}`);
                  console.log(`    Type:           ${light.model.type}`);
                  console.log(`    Color Gamut:    ${light.model.colorGamut}`);
                  console.log(`    Friends of Hue: ${light.model.friendsOfHue}`);
                  console.log(`  Software Version: ${light.softwareVersion}`);
                  console.log('  State:');
                  console.log(`    On:         ${light.on}`);
                  console.log(`    Reachable:  ${light.reachable}`);
                  console.log(`    Brightness: ${light.brightness}`);
                  console.log(`    Color mode: ${light.colorMode}`);
                  console.log(`    Hue:        ${light.hue}`);
                  console.log(`    Saturation: ${light.saturation}`);
                  console.log(`    X/Y:        ${light.xy[0]}, ${light.xy[1]}`);
                  console.log(`    Color Temp: ${light.colorTemp}`);
                  console.log(`    Alert:      ${light.alert}`);
                  console.log(`    Effect:     ${light.effect}`);
                  console.log();*/
              }
          });

  }

  registerGroups(client, node) {
        let self = this;
        client.groups.getAll()
            .then(groups => {
                for (let group of groups) {
                    self.log.info(`Found Philips Group: ${group.name}, id: ${group.id}`);
                    self.__controller.addOrUpdateSensor({id: parseInt(group.id), hueType: 'group'},
                        {id: parseInt(group.id), hueType: 'group', name: group.name, functionType: [self.__controller.sensorFunctionType.switch, self.__controller.sensorFunctionType.brightness],
                            stateOn: group.state.attributes.all_on, stateBrigthness: Math.trunc(group.action.attributes.bri * 100 / 254), vendor: {group}}, node,
                        function(err, sensor) {
                            if (err) self.log.error(err);

                            sensor.updateGroup = function(on, brightness) {
                                client.groups.getById(this.id)
                                    .then(group  => {
                                        if (brightness != null)
                                            group .brightness = Math.trunc(brightness * 254 / 100);
                                        if (on != null)
                                            group .on = on;
                                        return client.groups.save(group );
                                    })
                                    .then(group => {
                                        self.log.info(`Updated group  [${group.id}]`);
                                    })
                                    .catch(error => {
                                        cself.log.error(error.stack);
                                    });
                            };

                            sensor.refresh = function(){
                                let sensor = this;
                                client.groups.getById(this.id)
                                    .then(group => {
                                        self.__controller.updateSensor(sensor, {name: group.name,
                                            stateOn: group.state.attributes.all_on, stateBrigthness: Math.trunc(group.action.attributes.bri * 100 / 254), vendor: {group}});
                                        self.__controller.addSensorValue(sensor, group.state.attributes.all_on);
                                    });
                            };

                            sensor.turnOn = function(){
                                this.updateGroup(true, null);
                                this.stateOn = true;
                                self.__controller.addSensorValue(this, true);
                            };
                            sensor.turnOff = function(){
                                this.updateGroup(false, null);
                                this.stateOn = false;
                                self.__controller.addSensorValue(this, false);
                            };
                            sensor.brightness = function(value){
                                this.updateGroup(null, parseInt(value));
                                this.stateBrigthness = parseInt(value);
                            };
                        });

                    /*console.log(`Group [${group.id}]: ${group.name}`);
                    console.log(`  Type: ${group.type}`);
                    console.log(`  Class: ${group.class}`);
                    console.log('  Light Ids: ' + group.lightIds.join(', '));
                    console.log('  State:');
                    console.log(`    Any on:     ${group.anyOn}`);
                    console.log(`    All on:     ${group.allOn}`);
                    console.log('  Action:');
                    console.log(`    On:         ${group.on}`);
                    console.log(`    Brightness: ${group.brightness}`);
                    console.log(`    Color mode: ${group.colorMode}`);
                    console.log(`    Hue:        ${group.hue}`);
                    console.log(`    Saturation: ${group.saturation}`);
                    console.log(`    X/Y:        ${group.xy[0]}, ${group.xy[1]}`);
                    console.log(`    Color Temp: ${group.colorTemp}`);
                    console.log(`    Alert:      ${group.alert}`);
                    console.log(`    Effect:     ${group.effect}`);

                    if (group.modelId !== undefined) {
                        console.log(`  Model Id: ${group.modelId}`);
                        console.log(`  Unique Id: ${group.uniqueId}`);
                        console.log('  Model:');
                        console.log(`    Id:           ${group.model.id}`);
                        console.log(`    Manufacturer: ${group.model.manufacturer}`);
                        console.log(`    Name:         ${group.model.name}`);
                        console.log(`    Type:         ${group.model.type}`);
                    }
                   */
                }
            });
    }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'huejay',
    params: params,
    pluginClass: huejayPlugin
  });
};


