const { Client } = require('tplink-smarthome-api');
 
const client = new Client();

// Client events `device-*` also have `bulb-*` and `plug-*` counterparts.
// Use those if you want only events for those types and not all devices.

/*client.getDevice({host: '192.168.0.131'}).then((device) => {
  device.getSysInfo().then(console.log);
  device.setPowerState(false);
  device.getSysInfo().then(console.log);

});*/

client.startDiscovery({discoveryTimeout: 15000}).on('device-new', (device) => {
  device.getSysInfo().then(function(device){console.log(device)});
  //device.setPowerState(true);
});

