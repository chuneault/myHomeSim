/**
 * Created by chune on 2016-11-21.
 */

let unirest = require('unirest');

unirest.get('https://api.vultr.com/v1/dns/records')
    .headers({'API-Key': '7JPMNZFXC3LFSZ7TZWKSAU7FYOVP2PZ2XZUA'})
    .query({domain: "huneault.ca"})
    .end(function (response) {
      var dnsHome = _.find(response.body, {name: 'home'});
      unirest.post('https://api.vultr.com/v1/dns/update_record')
          .headers({'API-Key': '7JPMNZFXC3LFSZ7TZWKSAU7FYOVP2PZ2XZUA'})
          .send({RECORDID: dnsHome.RECORDID, data: sensor.lastValue, domain: 'huneault.ca' })
          .end(function (response) {
            //console.log(response.body);
          });
    });
