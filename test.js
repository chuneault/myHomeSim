const _ = require('lodash');
const moment = require('moment');

/*let myWizeCams  =  [{endTime:  moment().add(-10, 'minutes')}, {endTime:  moment().add(2, 'minutes')}];

 _.forEachRight(myWizeCams, function(myWizeCam, index) {
        if (myWizeCam.endTime.diff(moment(), 'seconds') >= 0) {
          //console.log('delete', myWizeCam, index);
          delete myWizeCams[index];
        }
    });
*/

const log4js = require('log4js');
const myAppenders = require('./logger_appenders.js');

log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'colored' }},
               file: {type: 'file', filename: 'test.log'},
               justError: { type: 'logLevelFilter', appender: 'out', level: 'error' },
               test: {type: 'logger_appenders'}
             },
  
  categories: { default: { appenders: ['justError', 'test'], level: 'debug' }}

});

const logger = log4js.getLogger();
logger.trace('log trace');
logger.debug('log debug');
logger.info('log info' );
logger.warn('log warn');
logger.error('log error');
logger.fatal('log fatal');
