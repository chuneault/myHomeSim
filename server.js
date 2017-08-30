/**
 * Created by chune on 2016-10-11.
 */



var hsController = require('./lib/hsController');
var hsDatabase = require('./lib/hsDatabase');


function serverConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
    case 'dev':
    default:
  }
}

function start(logger) {

  serverConfig();
  var ctrl = new hsController(logger);

  ctrl.on('loadDBCompleted', function() {

  });


  var db = new hsDatabase(ctrl);

}


exports.start = start;
