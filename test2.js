let unirest = require('unirest');

/*unirest.put('http://myHomeSim:8080/api/sensor/ryQIQiQEF-/40')
   .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
   .send({ "value": "ffffff" })
   .end(function (resp) {
       console.log(resp.body);
   });*/

/*unirest.put('http://127.0.0.1:8080/api/sensor/ryQIQiQEF-/40')
    .headers({'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'})
    .send({"value": "ffffff"})
    .end(function (resp) {
        console.log(resp.body);
    });*/

unirest.put('http://127.0.0.1:8080/api/sensor/ryQIQiQEF-/40')
        .headers({"Accept": "application/json",
                  "content-type": "application/x-www-form-urlencoded",
                  "value": "ffffff"})
        .form({"value": "ffffff"})
        .end(function (resp) {
            console.log(resp.body);
    });
