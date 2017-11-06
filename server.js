/**
 * Created by chune on 2016-10-11.
 */



var hsController = require('./lib/hsController');
var hsDatabase = require('./lib/hsDatabase');


function serverConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
      break;
    case 'dev':

      break;
    default:
  }
}

function start(logger) {

  let options = serverConfig();
  new hsController(logger, options)
    on('loadDBCompleted', function() {

  });

  new hsDatabase(ctrl, options);

}


exports.start = start;
