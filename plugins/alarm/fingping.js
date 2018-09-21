// Use arp-scan to find hosts on the network
const spawn = require('child_process');

/*
fing 192.168.0.122/32 -o table,json -r 3 --silent

*/

function pingIP(ip){
	return new Promise(function(response,reject){
		spawn.exec('fing ' + ip + '/32 -o table,json -r 3 --silent', function (err, stdout, stderr){
			if (err) {
				console.log("child processes failed with error code: " +
					err.code + stderr);
			}
			response(stdout);
		});
	});
}

function scan(opts){
    return new Promise(function(response,reject){
        spawn.exec('fing -otable,json -r1 --silent', function (err, stdout, stderr){
            if (err) {
                console.log("child processes failed with error code: " +
                    err.code + stderr);
            }
            response(stdout);
        });
    });
}


module.exports = {"ping": pingIP, "scan": scan};


