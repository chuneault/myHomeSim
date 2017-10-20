let unirest = require('unirest');

unirest.put('http://myHomeSim:8080/api/sensor/{id}/40')
   .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
   .send({ "value": "ffffff" })
   .end(function (resp) {
       console.log(resp.body);
   });