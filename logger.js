/**
 * Created by chune on 2016-10-21.
 */

const log4js = require('log4js');
const myAppenders = require('./logger_appenders');
const shortId = require('shortid');

class logger {
  constructor() {
      this.profiling = {};

      this.logConfig = {
          appenders: {
              out: { type: 'stdout', layout: { type: 'colored' }},
              console: {type: 'console'},
              justError: { type: 'logLevelFilter', appender: 'out', level: 'error' }
          },
          categories: {
              default: { appenders: ['justError'], level: 'info' },
              tcp: {appenders: ['console'], level: 'info' }
          }
      };

      log4js.configure(this.logConfig);
  }


  addLoggerMemory(name, config){
      let nameId = shortId.generate();
      console.log('addLoggerMemory', nameId, name);
      this.logConfig.appenders[nameId]  = {type: 'logger_appenders'};
      this.logConfig.categories[nameId] = {appenders: ['justError', nameId], level: 'info'};
      log4js.configure(this.logConfig);
      let result = log4js.getLogger(nameId);
      return result;
      /*let result = log4js.getLogger('console');
      return result;*/
  }


  addSocket(name, config){
      /*this.logConfig.appenders[name]  = {type: 'tcp'};
      this.logConfig.categories[name] = {appenders: ['justError', name], level: 'info'};
      log4js.configure(this.logConfig);*/
      let result = log4js.getLogger('console');
      return result;
  }


  addLogger(name, config) {
      let self = this;
      this.logConfig.appenders[name]  = {type: 'file', filename: config.fileName, maxLogSize: 5242880};
      this.logConfig.categories[name] = {appenders: ['justError', name], level: 'debug'};
      log4js.configure(this.logConfig);
      let result = log4js.getLogger(name);

      result.profileTime = function(name) {
          self.profiling[name] = process.hrtime();
      };
      result.profileEnd = function(name) {
          let start = self.profiling[name];
          let elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
          this.debug(name, process.hrtime(start)[0] + " s, " + elapsed.toFixed(3) + " ms"); // print message + time
      };
      this[name] = result;
      return result;
  }
}

module.exports = new logger;

