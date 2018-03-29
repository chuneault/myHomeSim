let schedule = require('node-schedule');
let callSunriseAfterLoad = false;
let callSunsetAfterLoad = false;


function getSunPhase() {
    let unirest = require('unirest');
    unirest.get('http://api.wunderground.com/api/bccd91f6919ff946/lang:FC/conditions/forecast/astronomy/q/canada/sainte-therese.json')
        .end(function (resp) {
            //console.log(resp.body);

            let dateSunrise = new moment().hour(resp.body.sun_phase.sunrise.hour).minute(resp.body.sun_phase.sunrise.minute).second(0);
            let dateSunset = new moment().hour(resp.body.sun_phase.sunset.hour).minute(resp.body.sun_phase.sunset.minute).second(0);


            callSunriseAfterLoad = (moment().isAfter(dateSunrise) && moment().isBefore(dateSunset));
            console.log('callSunriseAfterLoad', callSunriseAfterLoad);


            if (moment().isBefore(dateSunrise)) {
                console.log('Schedule Sunrise Event at', dateSunrise.format('LLLL'));
                schedule.scheduleJob(dateSunrise.toDate(), function () {
                    console.log('Sunrise !!!!!');
                    server.event.emit('sunrise');
                });
            }

            callSunsetAfterLoad = (moment().isAfter(dateSunset) && moment().isAfter(dateSunset));
            console.log('callSunsetAfterLoad', callSunsetAfterLoad);

            if (moment().isBefore(dateSunset)) {
                console.log('Schedule Sunset Event at', dateSunset.format('LLLL'));
                schedule.scheduleJob(dateSunset.toDate(), function () {
                    console.log('Sunset !!!!!');
                    server.event.emit('sunset');
                });
            }

            if (callSunriseAfterLoad || callSunsetAfterLoad) {

                console.log('need to wait checkethernetGatewayConnected and kasatplinkConnected');
                let checkethernetGatewayConnected = function(){
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
        })

}

server.on('newDay',function(){
    getSunPhase();
});

server.on('sunrise', function(){
    try {
     console.log('Open Aqua Led Strip');
     let sensor = server.vars['AQUALEDCOLOR'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '40', 'ffffff');
     sensor = server.vars['AQUALEDBRIGHT'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '23', 255);
     console.log('Open Aquarium Salon');
     sensor = _.find(server.sensors, {name: "Aquarium Salon"});
     sensor.turnOn();
     console.log('Open Aquarium Bureau');
     sensor = _.find(server.sensors, {name: "Aquarium Bureau"});
     sensor.turnOn();
    }
    catch(err) {
     console.log('sunrise error', err.message);
    }

});

server.on('sunset', function(){
    try {
     console.log('Close Aqua Led Strip');
     let sensor = server.vars['AQUALEDCOLOR'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '40', '73763');
     sensor = server.vars['AQUALEDBRIGHT'];
     sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, '23', 63);
     console.log('Close Aquarium Salon');
     sensor = _.find(server.sensors, {name: "Aquarium Salon"});
     sensor.turnOff();
     console.log('Close Aquarium Bureau');
     sensor = _.find(server.sensors, {name: "Aquarium Bureau"});
     sensor.turnOff();
    }
    catch(err) {
     console.log('sunset error', err.message);
    }
});

getSunPhase();
