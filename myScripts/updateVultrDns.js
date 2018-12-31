/**
 * Created by chune on 2016-11-21.
 */

let unirest = require('unirest');

try {

unirest.get('https://api.vultr.com/v1/dns/records')
    .headers({'API-Key': 'BS5VUHUUFOBUMUOXBYWBKO5KNDK5QCIX4BYQ'})
    .query({domain: "huneault.ca"})
    .end(function (response) {

     let updateDNS = function(recordId) {

             unirest.post('https://api.vultr.com/v1/dns/update_record')
                 .headers({'API-Key': 'BS5VUHUUFOBUMUOXBYWBKO5KNDK5QCIX4BYQ'})
                 .send({RECORDID: recordId, data: sensor.lastValue, domain: 'huneault.ca' })
                 .end(function (response) {
                     server.log.debug('update dns', response.body);
                 });

     };

     server.log.debug('api.vultr.com', response.body);
     let dnsHome = _.find(response.body, {name: 'home'});
     if (dnsHome ) updateDNS(dnsHome.RECORDID);
     let dnsMaster = _.find(response.body, {name: '', type: 'A'});
     if (dnsMaster ) updateDNS(dnsMaster.RECORDID);


    });

}

catch (err) {
  // Handle the error here.
  console.log('Error updateVultrDns', err);
}
