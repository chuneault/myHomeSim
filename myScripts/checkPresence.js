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
            if (host.alive == null) host.alive = isAlive;
            if (host.alive != isAlive) {

                server.invokeAction('castwebapi','TTS',['bureau', host.desc + isAlive ?  'vient d\'entrer à la maison' :  ' est sortie de la maison']);
                server.invokeAction('pushBullet','sendMessage',[host.desc, isAlive ?  'vient d\'entrer à la maison' :  ' est sortie de la maison']);


                host.alive = isAlive;
            }
        }, cfg);
    });

}

checkHome();

setInterval(function (){
    checkHome();
}, 10000);
