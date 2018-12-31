const plugins = require("../../lib/hsPlugins.js");
const schedule = require('node-schedule');
const unirest = require('unirest');
const _       = require('lodash');

class weather extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;

        self.log = params.logger.addLogger('wunderground', {fileName: './logs/wunderground.log'});

        controller.on('loadDBCompleted', function () {
            controller.addOrGetNode({name: 'wunderground'}, {name: 'wunderground'}, null,
                function (error, node) {
                    if (node) {
                        self.checkweather(node);
                        schedule.scheduleJob('*/15 * * * *', function () { //every 15 minutes
                            self.checkweather(node);
                        });
                    }
                });
          });
    };

    checkweather(node) {
        let ctrl = this.__controller;
        let self = this;
        _.forEach(this.params, function(param){
            self.log.debug('checkweather', param);
            unirest.get(param.url)
                .end(function (resp) {
                    if (resp.body)
                      ctrl.addOrUpdateSensor({name: param.name}, {name: param.name, vendor: resp.body}, node,
                        function (err, sensor) {
                          if (err) self.log.error('checkweather', err);
                        }
                    );
                })
        });
    }
}

exports.connect = function (pluginType, params, callback) {
    callback({
        name: 'wunderground',
        params: params,
        pluginClass: weather
    });
};


