let huejay = require('huejay');

huejay.discover()
  .then(bridges => {
    for (let bridge of bridges) {
      console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);

      let client = new huejay.Client({
        host:     bridge.ip,
        port:     80,               // Optional
        username: 'uZR5pbc3P2aUmCtdn6JQzOn-gEXipyA4ZU9m1TR6', // Optional
        timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
      });

      client.users.getAll()
       .then(users => {
           for (let user of users) {
           console.log(`Username: ${user.username}`);
       }
      });


/*client.sensors.getAll()
  .then(sensors => {
    for (let sensor of sensors) {
      console.log(`Sensor [${sensor.id}]: ${sensor.name}`);
      console.log(`  Type:             ${sensor.type}`);
      console.log(`  Manufacturer:     ${sensor.manufacturer}`);
      console.log(`  Model Id:         ${sensor.modelId}`);
      console.log('  Model:');
      console.log(`    Id:             ${sensor.model.id}`);
      console.log(`    Manufacturer:   ${sensor.model.manufacturer}`);
      console.log(`    Name:           ${sensor.model.name}`);
      console.log(`    Type:           ${sensor.model.type}`);
      console.log(`  Software Version: ${sensor.softwareVersion}`);
      console.log(`  Unique Id:        ${sensor.uniqueId}`);
      console.log(`  Config:`);
      console.log(`    On:             ${sensor.config.on}`);
      console.log(`  State:`);
      console.log(`    Last Updated:   ${sensor.state.lastUpdated}`);
      console.log();
    }
  })
  .catch(error => {
    console.log(error.stack);
  });*/


/*client.lights.getAll()
  .then(lights => {
    for (let light of lights) {
      console.log(`Light [${light.id}]: ${light.name}`);
      console.log(`  Type:             ${light.type}`);
      console.log(`  Unique ID:        ${light.uniqueId}`);
      console.log(`  Manufacturer:     ${light.manufacturer}`);
      console.log(`  Model Id:         ${light.modelId}`);
      console.log('  Model:');
      console.log(`    Id:             ${light.model.id}`);
      console.log(`    Manufacturer:   ${light.model.manufacturer}`);
      console.log(`    Name:           ${light.model.name}`);
      console.log(`    Type:           ${light.model.type}`);
      console.log(`    Color Gamut:    ${light.model.colorGamut}`);
      console.log(`    Friends of Hue: ${light.model.friendsOfHue}`);
      console.log(`  Software Version: ${light.softwareVersion}`);
      console.log('  State:');
      console.log(`    On:         ${light.on}`);
      console.log(`    Reachable:  ${light.reachable}`);
      console.log(`    Brightness: ${light.brightness}`);
      console.log(`    Color mode: ${light.colorMode}`);
      console.log(`    Hue:        ${light.hue}`);
      console.log(`    Saturation: ${light.saturation}`);
      console.log(`    Color Temp: ${light.colorTemp}`);
      console.log(`    Alert:      ${light.alert}`);
      console.log(`    Effect:     ${light.effect}`);
      console.log();
    }
  });*/

client.groups.getAll()
  .then(groups => {
    for (let group of groups) {
      console.log(`Group [${group.id}]: ${group.name}`);
      console.log(`  Type: ${group.type}`);
      console.log(`  Class: ${group.class}`);
      console.log('  Light Ids: ' + group.lightIds.join(', '));
      console.log('  State:');
      console.log(`    Any on:     ${group.anyOn}`);
      console.log(`    All on:     ${group.allOn}`);
      console.log('  Action:');
      console.log(`    On:         ${group.on}`);
      console.log(`    Brightness: ${group.brightness}`);
      console.log(`    Color mode: ${group.colorMode}`);
      console.log(`    Hue:        ${group.hue}`);
      console.log(`    Saturation: ${group.saturation}`);
      console.log(`    Color Temp: ${group.colorTemp}`);
      console.log(`    Alert:      ${group.alert}`);
      console.log(`    Effect:     ${group.effect}`);
 
      if (group.modelId !== undefined) {
        console.log(`  Model Id: ${group.modelId}`);
        console.log(`  Unique Id: ${group.uniqueId}`);
        console.log('  Model:');
        console.log(`    Id:           ${group.model.id}`);
        console.log(`    Manufacturer: ${group.model.manufacturer}`);
        console.log(`    Name:         ${group.model.name}`);
        console.log(`    Type:         ${group.model.type}`);
      }
 
      console.log();
    }
  });




    }
  })
  .catch(error => {
    console.log(`An error occurred: ${error.message}`);
  });
