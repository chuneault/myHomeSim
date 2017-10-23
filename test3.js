let unirest = require('unirest');

/*unirest.put('http://myHomeSim:8080/api/sensor/ryQIQiQEF-/40')
   .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
   .send({ "value": "ffffff" })
   .end(function (resp) {
       console.log(resp.body);
   });*/

const vm      = require('vm'),
      moment  = require('moment'),
      _       = require('lodash');

function runScript(script) {
    var fs = require('fs');
    let runScript = script;
    runScript = fs.readFileSync(runScript.scriptFileName, 'utf8');

    const sandbox = _.extend({server: this,
        format:  require('string-format'),
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        moment: moment,
        require: require,
        _: _,
        console: console}, {});
    vm.createContext(sandbox);
    vm.runInContext(runScript, sandbox);

}

runScript({scriptFileName: './test2.js'});