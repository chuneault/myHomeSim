const PouchDB = require('pouchdb');
const PromisifyMe = require('promisify-me');
const DataStore = PromisifyMe(require('nedb'), 'nedb');

function importDB(srcDbName, destDBName, callBackDoc) {
    let db = new PouchDB('http://192.168.0.150:5984/'+destDBName);
    let nedbRows = new DataStore('./data/'+srcDbName+'.db');
    nedbRows.loadDatabase();
    let rows = nedbRows.find({});

    rows.exec().then(function (rows) {
        rows.forEach(function (doc) {
            if (callBackDoc)
                callBackDoc(doc);
            db.put(doc, function(err, response) {
                if (err) { return console.log(err); }
                // handle response
            });
        });
    }).done(function () {});
}



importDB('nodes', 'myHomeSim', function(doc){
    doc.deviceId = doc._deviceId;
    doc.type = 'nodes';

    delete doc._deviceId;
});

importDB('sensors', 'myHomeSim', function(doc){
    doc.nodeId = doc._nodeId;
    doc.type = 'sensors';
    delete doc._nodeId;
});

importDB('plugins', 'myHomeSim', function(doc){
    //doc.nodeId = doc._nodeId;
    //delete doc._nodeId;
});
