const { Client } = require('tplink-smarthome-api');
const hue  = require("node-hue-api");
const hueApi = hue.HueApi;
const _       = require('lodash');

function testPhilipsHue(){
  let api = new hueApi('192.168.0.178', 'uZR5pbc3P2aUmCtdn6JQzOn-gEXipyA4ZU9m1TR6');
  api.lights(function(err, light) {
      if (err) throw err;
      console.log(lights)
  });
}

function testTplink()  {
    const client = new Client();

    // Client events `device-*` also have `bulb-*` and `plug-*` counterparts.
    // Use those if you want only events for those types and not all devices.

    /*client.getDevice({host: '192.168.0.131'}).then((device) => {
      device.getSysInfo().then(console.log);
      device.setPowerState(false);
      device.getSysInfo().then(console.log);

    });*/

    client.startDiscovery({discoveryTimeout: 15000}).on('device-new', (device) => {
        device.getSysInfo().then(function (device) {
            console.log(device)
        });
        //device.setPowerState(true);
    });

}

testPhilipsHue();