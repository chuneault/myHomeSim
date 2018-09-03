const  ping = require('ping');

let  hosts = [{ip: '192.168.0.151', desc: 'Carl', alive: null}, {ip: '192.168.0.188', desc: 'Annie', alive: null}];

function checkHome() {

  let cfg = {
    timeout: 5,
    // WARNING: -i 2 may not work in other platform like window
    extra: ["-i 2"],
  };


  hosts.forEach(function(host){
    ping.sys.probe(host.ip, function(isAlive){
        var msg = isAlive ?  host.desc + ' est à la maison' :  host.desc + ' n\'est pas la';
        if (host.alive == null) host.alive = isAlive;
        if (host.alive != isAlive) { 
          console.log(msg);
          host.alive = isAlive;
        }
    }, cfg);
  });

}


checkHome();

setInterval(function (){
    checkHome();
  }, 10000);

