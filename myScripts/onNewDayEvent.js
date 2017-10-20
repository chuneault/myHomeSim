let unirest = require('unirest');
let schedule = require('node-schedule');
let callSunriseAfterLoad = false;
let callSunsetAfterLoad = false;



function getSunPhase() {
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

                console.log('need to wait checkethernetGatewayConnected');
                let checkethernetGatewayConnected = function(){
                    console.log('checkethernetGatewayConnected');
                    if (server.vars['checkethernetGatewayConnected'] != true)
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
    console.log('Open Aqua Led Strip');

    for (let i=1; i<=3; i++) {
      let sensor = server.vars['AQUALEDCOLOR'];
      sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 40, 'ffffff');
      sensor = server.vars['AQUALEDBRIGHT'];
      sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 23, '255');
    }
});

server.on('sunset', function(){
    console.log('Close Aqua Led Strip');

    for (let i=1; i<=3; i++) {
      let sensor = server.vars['AQUALEDCOLOR'];
      sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 40, '073763');
      sensor = server.vars['AQUALEDBRIGHT'];
      sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 23, '63');
    }
});


getSunPhase();
