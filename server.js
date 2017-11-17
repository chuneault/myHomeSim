/**
 * Created by chune on 2016-10-11.
 */

var hsController = require('./lib/hsController');
var hsDatabase = require('./lib/hsDatabase');

/*
function serverConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
      break;
    case 'dev':

      break;
    default:
  }
}
*/

function start(logger, config) {
  //let options = serverConfig();
  let ctrl = new hsController(logger, config);
  let db = new hsDatabase(ctrl, config);
}

exports.start = start;
