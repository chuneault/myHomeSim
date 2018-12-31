const GoogleHome = require('node-googlehome')

let device = new GoogleHome.Connecter('192.168.2.20');


device.readySpeaker()
  .then(() => { 

device.playMedia('http://192.168.2.28:8080/img/polly.mp3')
  .then(console.log)
  .catch(console.log);

device.playMedia('http://192.168.2.28:8080/img/polly.mp3')
  .then(console.log)
  .catch(console.log);




 });


console.log('end');
