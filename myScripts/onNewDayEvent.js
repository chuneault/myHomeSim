let schedule = require('node-schedule');
let callSunriseAfterLoad = false;
let callSunsetAfterLoad = false;


function getSunPhase() {
    let unirest = require('unirest');
    unirest.get('http://api.wunderground.com/api/bccd91f6919ff946/lang:FC/conditions/forecast/astronomy/q/canada/sainte-therese.json')
        .end(function (resp) {
            try {
                let dateSunrise = new moment().hour(resp.body.sun_phase.sunrise.hour).minute(resp.body.sun_phase.sunrise.minute).second(0);
                let dateSunset = new moment().hour(resp.body.sun_phase.sunset.hour).minute(resp.body.sun_phase.sunset.minute).second(0);


                callSunriseAfterLoad = (moment().isAfter(dateSunrise) && moment().isBefore(dateSunset));


                if (moment().isBefore(dateSunrise)) {
                    //console.log('Schedule Sunrise Event at', dateSunrise.format('LLLL'));
                    schedule.scheduleJob(dateSunrise.toDate(), function () {
                        //console.log('Sunrise !!!!!');
                        server.event.emit('sunrise');
                    });
                }

                callSunsetAfterLoad = (moment().isAfter(dateSunset) && moment().isAfter(dateSunset));
                //console.log('callSunsetAfterLoad', callSunsetAfterLoad);

                if (moment().isBefore(dateSunset)) {
                    //console.log('Schedule Sunset Event at', dateSunset.format('LLLL'));
                    schedule.scheduleJob(dateSunset.toDate(), function () {
                        //console.log('Sunset !!!!!');
                        server.event.emit('sunset');
                    });
                }

                if (callSunriseAfterLoad || callSunsetAfterLoad) {

                    //console.log('need to wait checkethernetGatewayConnected and kasatplinkConnected');
                    let checkethernetGatewayConnected = function () {
                        //console.log('mySensorsEthernet ready && kasa-tplink ready');
                        //console.log(server.vars.ready);
                        if ((server.vars.ready['ethernetGateway'] != true) || (server.vars.ready['kasa-tplink'] != true))
                            setTimeout(checkethernetGatewayConnected, 1000);
                        else {
                            if (callSunsetAfterLoad)
                                server.event.emit('sunset');
                            if (callSunriseAfterLoad)
                                server.event.emit('sunrise');
                        }
                    };

                    checkethernetGatewayConnected();
                }

            }
            catch (error) {
                server.log.error('getSunPhase error', error);
                setTimeout(function(){
                    getSunPhase();
                }, 5000); //retry

            }

        })
}

server.on('newDay',function(){
    getSunPhase();
});

server.on('sunrise', function(){ //levé du soleil
    try {
     server.log.info('Open Aqua Led Strip');
     let sensor = server.vars['AQUALEDCOLOR'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '40', 'ffffff');
     sensor = server.vars['AQUALEDBRIGHT'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '23', 255);


     server.log.info('Open Aquarium Salon');
     sensor = _.find(server.sensors, {name: "Aquarium Salon"});
     sensor.turnOn();
     server.log.info('Open Aquarium Bureau');
     sensor = _.find(server.sensors, {name: "Aquarium Bureau"});
     sensor.turnOn();
    }
    catch(err) {
        server.log.error('sunrise error', err);
    }

});

server.on('sunset', function(){
    try {
     server.log.info('Close Aqua Led Strip');
     let sensor = server.vars['AQUALEDCOLOR'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '40', '73763');
     sensor = server.vars['AQUALEDBRIGHT'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '23', 63);

     server.log.info('Close Aquarium Salon');
     sensor = _.find(server.sensors, {name: "Aquarium Salon"});
     server.log.info('turnOff', sensor._id);
     sensor.turnOff();
     server.log.info('Close Aquarium Bureau');
     sensor = _.find(server.sensors, {name: "Aquarium Bureau"});
     server.log.info('turnOff', sensor._id);
     sensor.turnOff();
    }
    catch(err) {
      server.log.error('sunset error', err);
    }
});

getSunPhase();
