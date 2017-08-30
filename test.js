/**
 * Created by chune on 2016-10-12.
 */


require('colors');

var path         = require('path'),
    _            = require('lodash'),
    format       = require('string-format')
    PromisifyMe = require('promisify-me');

/*
var DataStore = PromisifyMe(require('nedb'), 'nedb');
var sensorsVals = new DataStore('./data/sensorsValues.db');
sensorsVals.loadDatabase();

var cursor = sensorsVals.find({_sensorId: 'rJWMiyi7Zg',
  valueDate: {$gt: "1" }}).sort({ valueDate: -1 });
cursor.exec().then(function(vals) {
  console.log(vals);
});
*/

var unirest = require('unirest');

unirest.get('https://api.vultr.com/v1/dns/records')
    .headers({'API-Key': '7JPMNZFXC3LFSZ7TZWKSAU7FYOVP2PZ2XZUA'})
    .query({domain: "huneault.ca"})
    .end(function (response) {
      var dnsHome = _.find(response.body, {name: 'home'});
      console.log(dnsHome);
      /*unirest.post('https://api.vultr.com/v1/dns/update_record')
          .headers({'API-Key': '7JPMNZFXC3LFSZ7TZWKSAU7FYOVP2PZ2XZUA'})
          .send({RECORDID: dnsHome.RECORDID, data: '127.0.0.1', domain: 'huneault.ca' })
          .end(function (response) {
            console.log(response.body);
          });*/
    });

//curl -H 'API-Key: EXAMPLE'  --data 'domain=example.com' --data 'name=vultr' --data 'type=A' --data 'data=127.0.0.1'

/*
console.log(JSON.stringify(t, function(key, value){
  if (!_.startsWith(key, "_"))
    return value;
}, " "));*/
/*
const test = require('./test2');
var t = new test(1);

serializeObj = function(obj) {
  return _.omitBy(obj, function(val, key){
    return (_.startsWith(key, '__'));
  });
};


console.log(serializeObj(t));

this.db.plugins.insert(serializeObj(t), function (err, newDoc) {   // Callback is optional
  console.log(err);
  console.log(newDoc);
});
*/


/*var timer = 0;

var testInvoke = function() {

  if (timer == 0)
    timer = setTimeout(function (){
      clearTimeout(timer);
      timer = 0;
      console.log('invoke runned');
  }, 1000);
};

testInvoke();
testInvoke();
testInvoke();
testInvoke();

setTimeout(function(){testInvoke();}, 2000);*/

//var unirest = require('unirest');

/*
unirest.post('http://api.pushingbox.com/pushingbox')
    //.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    .send({ devid: 'v1751D58E97109EF', title: 'Ding Dong Avant', message: 'Cours Forest Cours' })
    .end(function (response) {
      if (response.ok)
        console.log(response.code);
    });
*/

/*

unirest.post('https://newtifry.appspot.com/newtifry')
    .send({format: 'json',
           source: 'dcd68f6af387c83592765149ef30785f',
           title: 'Allo',
           message: 'Cours Forest Cours',
           priority: 1
         })
    .end(function (response) {
      if (response.ok)
        console.log(response.body);
    });

*/


//([\[\]])\1|[\[](.*?)(?:!(.+?))?[\]]

/*
var generateInteraction = function(interaction) {
  var orValues = [];
  var regEx = /([\[\]])\1|[\[](.*?)(?:!(.+?))?[\]]/g;
  var orVal;

  while ((orVal = regEx.exec(interaction.question)) !== null) {
    var orVals = orVal[2].split('|');
    orValues.push({or: orVal[0], vals: orVals});
  }

  regExOr = /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g;
  while ((orVal = regEx.exec(interaction.question)) !== null) {
    var orVals =
    orValues.push({or: orVal[0], vals: orVals});
  }



 var generate = function(index, orValues , question, result ) {
   _.forEach(orValues[index].vals, function(value) {
     result = _.replace(question,orValues[index].or, value);
     if (index<orValues.length-1)
         generate(index+1, orValues, result, result);
     else
       console.log(result);
   });
 };

 generate(0, orValues, interaction.question, interaction.question);






  //console.log(orValues);

};


generateInteraction({
  question: 'quelle est la [température|test] [du |de |de la |de l\']{object}',
  object: {filer: [{name: 'S_TEMP'}]},
  answer: 'la température est de {value} degré'
});

*/



