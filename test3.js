const PouchDB = require('pouchdb');
const PromisifyMe = require('promisify-me');
const DataStore = PromisifyMe(require('nedb'), 'nedb');

function importDB(dbName, callBackDoc) {
    let db = new PouchDB('http://192.168.0.150:5984/'+dbName);
    let nedbRows = new DataStore('./data/'+dbName+'.db');
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



importDB('nodes', function(doc){
    doc.deviceId = doc._deviceId;
    delete doc._deviceId;
});

importDB('sensors', function(doc){
    doc.nodeId = doc._nodeId;
    delete doc._nodeId;
});

importDB('plugins', function(doc){
    //doc.nodeId = doc._nodeId;
    //delete doc._nodeId;
});
