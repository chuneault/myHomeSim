
let schedule = require('node-schedule');
let moment = require('moment');
let date = moment().hour(19).minute(3);

console.log('Schedule Sunrise Event at', date.format('LLLL'));
    schedule.scheduleJob(date.toDate(), function(){
    console.log('Sunrise !!!!!');
 });

console.log(date.toDate());

var readline = require('readline'), 
rl = readline.createInterface(process.stdin, process.stdout);
