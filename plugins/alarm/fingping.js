// Use arp-scan to find hosts on the network
const spawn = require('child_process');
const _       = require('lodash');

/*
fing 192.168.0.122/32 -o table,json -r 3 --silent

*/

function pingIP(ips, parseJSON = true){
	return new Promise(function(response){
		let ipsList = ips.toString().replace(/,/g, " ");
	    //console.log('run','fing -p ' + ipsList + ' -o json --silent');
		spawn.exec('fing -p ' + ipsList + ' -o json --silent', function (err, stdout, stderr){
			if (err) {
				console.log("child processes failed with error code: " +
					err.code + stderr);
			}
			if (parseJSON == true)
			    response(JSON.parse(stdout.replace(/,}/g, "}")));
            else
                response(stdout);
		});
	});
}

function fingIP(ip, options, parseJSON = true){
    return new Promise(function(response){
        spawn.exec('fing ' + ip + '/32 -o table,json --silent ' + options, function (err, stdout, stderr){
            if (err) {
                console.log("child processes failed with error code: " +
                    err.code + stderr);
            }
            if (parseJSON == true) {
                let stdouts = stdout.split('\n');
                let results = [];
                _.forEach(stdouts, function(result){
                    results.push(JSON.parse(result));
                });
                response(results);
            }
            else
                response(stdout);
        });
    });
}

function scan(options, parseJSON = true){
    return new Promise(function(response){
        //console.log('run', 'fing -otable,json --silent '+ options);
        spawn.exec('fing -otable,json --silent '+ options, function (err, stdout, stderr){
            if (err) {
                console.log("child processes failed with error code: " +
                    err.code + stderr);
            }
            if (parseJSON == true) {
                let stdouts = stdout.split('\r');
                let results = [];
                _.forEach(stdouts, function(result){
                    try {
                        let json = JSON.parse(result);
                        results.push(json);
                    }
                    catch(error) {
                        console.log(error);
                    }
                });
                response(results);
            }
            else
             response(stdout);
        });
    });
}

module.exports = {"ping": pingIP, "scan": scan, "fing": fingIP};


