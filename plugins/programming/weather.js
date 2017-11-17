const plugins = require("../../lib/hsPlugins.js");
let schedule = require('node-schedule');

class weather extends plugins {

    constructor(controller, params) {

        super(controller, params);

        let ctrl = this.__controller;
        let self = this;





            ctrl.addOrGetNode({name: 'weather'}, {name: 'weather'}, null,
                function (error, node) {
                    if (node) {
                        self.checkweather(node);

                        schedule.schedulejob('*/15 * * * *', function () {
                            //console.log('the answer to life, the universe, and everything!');
                            self.checkweather(node);
                        });

                    }
                });


        };
    }

    checkweather(node) {
        let unirest = require('unirest');
        let ctrl = this.__controller;
        unirest.get('http://api.wunderground.com/api/bccd91f6919ff946/lang:FC/conditions/forecast/astronomy/q/canada/sainte-therese.json')
            .end(function (resp) {
                console.log(resp.body);
                //resp.body.sun_phase.sunrise.hour

                /*ctrl.addOrUpdateSensor({_nodeId: node._id, name: 'home'}, {name: 'weather'}, node,
                    function (err, sensor) {
                        if (sensor.lastvalue != ip) {
                            ctrl.addsensorvalue(sensor, ip);
                        }

                });*/
            })
    }
}

exports.connect = function (pluginType, params, callback) {
    callback({
        name: 'weather',
        params: params,
        pluginClass: weather
    });
};


