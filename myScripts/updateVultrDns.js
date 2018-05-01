/**
 * Created by chune on 2016-11-21.
 */

let unirest = require('unirest');

try {

unirest.get('https://api.vultr.com/v1/dns/records')
    .headers({'API-Key': 'BS5VUHUUFOBUMUOXBYWBKO5KNDK5QCIX4BYQ'})
    .query({domain: "huneault.ca"})
    .end(function (response) {
      var dnsHome = _.find(response.body, {name: 'home'});
      if ((dnsHome) && (dnsHome.RECORDID)) {
        unirest.post('https://api.vultr.com/v1/dns/update_record')
          .headers({'API-Key': '7JPMNZFXC3LFSZ7TZWKSAU7FYOVP2PZ2XZUA'})
          .send({RECORDID: dnsHome.RECORDID, data: sensor.lastValue, domain: 'huneault.ca' })
          .end(function (response) {
            //console.log(response.body);
          });
      } else
        console.log('Vultr DNS Update Error', dnsHome);
    });

}

catch (err) {
  // Handle the error here.
  console.log('Error updateVultrDns', err);
}
