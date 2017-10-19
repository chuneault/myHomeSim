let unirest = require('unirest');
let schedule = require('node-schedule');


function getSunPhase() {
    unirest.get('http://api.wunderground.com/api/bccd91f6919ff946/lang:FC/conditions/forecast/astronomy/q/canada/sainte-therese.json')
        .end(function (resp) {
            //console.log(resp.body);

            let date = new Date();
            date.setHours(resp.body.sun_phase.sunrise.hour);
            date.setMinutes(resp.body.sun_phase.sunrise.minute);
            console.log('Schedule Sunrise Event at', date);
            schedule.scheduleJob(date, function(){
                console.log('Sunrise !!!!!');
                server.event.emit('sunrise');
            });

            date.setHours(resp.body.sun_phase.sunset.hour);
            date.setMinutes(resp.body.sun_phase.sunset.minute);
            console.log('Schedule Sunset Event at', date);
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