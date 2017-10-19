let unirest = require('unirest');
let schedule = require('node-schedule');


function getSunPhase() {
    unirest.get('http://api.wunderground.com/api/bccd91f6919ff946/lang:FC/conditions/forecast/astronomy/q/canada/sainte-therese.json')
        .end(function (resp) {
            //console.log(resp.body);

            let date = new moment().hour(resp.body.sun_phase.sunrise.hour).minute(resp.body.sun_phase.sunrise.minute);
            console.log('Schedule Sunrise Event at', date.format('LLLL'));
            schedule.scheduleJob(date, function(){
                console.log('Sunrise !!!!!');
                server.event.emit('sunrise');
            });

            date.hour(resp.body.sun_phase.sunset.hour);
            date.minute(resp.body.sun_phase.sunset.minute);
            console.log('Schedule Sunset Event at', date.format('LLLL'));
            schedule.scheduleJob(date, function(){
                console.log('Sunset !!!!!');
                server.event.emit('sunset');
            });


        })

}

server.on('newDay',function(){
    getSunPhase();
});

getSunPhase();

server.on('sunrise', function(){
    let sensor = server.vars['AQUALEDCOLOR'];
    sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 40, 'FFFF');

    sensor = server.vars['AQUALEDBRIGHT'];
    sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 23, '255');
});

server.on('sunset', function(){
    let sensor = server.vars['AQUALEDCOLOR'];
    sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 40, 'FFFF');

    sensor = server.vars['AQUALEDBRIGHT'];
    sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 23, '63');
});