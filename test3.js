const PouchDB = require('pouchdb');
const PromisifyMe = require('promisify-me');
const DataStore = PromisifyMe(require('nedb'), 'nedb');
const _       = require('lodash');


function importDB(srcDbName, destDBName, callBackDoc) {
    let db = new PouchDB('http://192.168.0.150:5984/'+destDBName);
    let nedbRows = new DataStore('./data/'+srcDbName+'.db');
    nedbRows.loadDatabase();
    let rows = nedbRows.find({});
    let allDoc = [];

    rows.exec().then(function (rows) {

        rows.forEach(function (doc) {
            if (callBackDoc)
                doc = callBackDoc(doc);
            allDoc.push(doc);
        });

        var postDoc = function(allDoc) {
            let docToPost = _.slice(allDoc, 0, 500);
            allDoc = _.drop(allDoc, 500);
                console.log('Adding', docToPost.length, 'pending', allDoc.length);
                db.bulkDocs(docToPost).then(function (result) {
                    console.log('done');
                    if (allDoc.length > 0)
                      postDoc(allDoc);
                    else
                      console.log('end');
                }).catch(function (err) {
                    console.log(err);
                });
        };
        postDoc(allDoc);
    }).done(function () {});
}

/*
{
    "_id":"BJ7VqeWZg",
    "_deviceId":"SJ6k70j1",
    "lastUpdate":1482509260820,
    "lastHeartBeat":1482509260820,
    "varName":null,
    "maxDelayHeartBeat":null

    "id":162,
    "mySensorsVersion":"2.0.1-beta",
    "name":"DOOR SWITCH",
    "version":7.1,
    "batteryLevel":100,
}
*/


importDB('nodes', 'myHomeSim', function(doc){
    let newDoc = {vendor: {}};
    newDoc.deviceId = doc._deviceId;
    newDoc.type = 'node';
    newDoc.name = doc.name;
    newDoc =  _.extend(newDoc, _.pick(doc, ['_id', 'lastUpdate', 'lastHeartBeat', 'varName', 'maxDelayHeartBeat', 'batteryLevel']));
    newDoc.vendor = _.omit(doc, ['_id', '_deviceId', 'lastUpdate', 'lastHeartBeat', 'varName', 'maxDelayHeartBeat', 'batteryLevel']);
    return newDoc;
});


/*
{
    "id":1,
    "name":"S_TEMP",
    "type":6,
    "desc":"Température",
    "_id":"B1gPMw5yWl",
    "_nodeId":"BkrMD9k-x",
    "previousValue":996,
    "previousValueDate":1503489160307,
    "lastValue":996,
    "lastDate":1503489491488,
    "offset":"value-=2;",
    "precision":2,
    "scriptOnChange":null
}
*/


importDB('sensors', 'myHomeSim', function(doc){
    let newDoc = {vendor: {}};
    newDoc.nodeId = doc._nodeId;
    newDoc.type = 'sensor';
    newDoc.name = doc.desc;
    newDoc =  _.extend(newDoc, _.pick(doc, ['varName', '_id', 'previousValue', 'previousValueDate', 'lastValue', 'lastDate', 'offset', 'precision', 'scriptOnChange']));
    newDoc.vendor = _.omit(doc, ['varName', '_id', '_nodeId', 'previousValue', 'previousValueDate', 'lastValue', 'lastDate', 'offset', 'precision', 'scriptOnChange']);
    return newDoc;
});


importDB('plugins', 'myHomeSim', function(doc){
    let newDoc;
    newDoc = _.extend({}, doc);
    //newDoc.nodeId = newDoc._nodeId;
    //delete newDoc._nodeId;
    newDoc.plugin = newDoc.type;
    newDoc.type = 'plugin';
    return newDoc;
});



/*
importDB('sensorsValues', 'sensorsValues', function(doc) {
    let newDoc;
    newDoc = _.extend({}, doc);
    newDoc.sensorId = newDoc._sensorId;
    delete newDoc._sensorId;
    delete newDoc._id;

    return newDoc;
});
*/

