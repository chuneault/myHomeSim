
let schedule = require('node-schedule');
let moment = require('moment');
let date = moment().hour(11).minute(10);

            console.log('Schedule Sunrise Event at', date.format('LLLL'));
            schedule.scheduleJob(date, function(){
                console.log('Sunrise !!!!!');
            });

var readline = require('readline'), 
rl = readline.createInterface(process.stdin, process.stdout);
