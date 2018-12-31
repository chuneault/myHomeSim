/**
 * Created by chune on 2018-10-24.
 */

console.log('checkAlarm', value);
if (value == true) {
    let running = server.vars.nmapScanCheckHomeRunning || false;
    if (running == false)
        server.plugins['nmapscan'].checkHome(false, Date.now() + (60000 * 5));
    server.plugins['openMQTTGateway'].checkIfAlarm(sensor);
}