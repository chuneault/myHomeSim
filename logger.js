/**
 * Created by chune on 2016-10-21.
 */

var winston = require('winston');
var cbuff   = require('winston-circular-buffer');
//winston.emitErrs = true;
const moment = require('moment');

class logger {
  constructor(){
  }


  addLoggerMemory(name, config){
    winston.loggers.add(name, {
      transports: [
        new (winston.transports.CircularBuffer)({
          name: 'memory',
          level: 'info',
          json: true,
          size: 100
        })
      ]
    });
    this[name] = winston.loggers.get(name);
    return this[name];
  }


  addLogger(name, config) {
    winston.loggers.add(name, {
      console: {
        level: config.level || 'info',
        //handleExceptions: true,
        json: false,
        colorize: true,
      },
      file: {
          formatter: function(options) {
            // Return string will be passed to logger.
            return JSON.stringify({level: options.level, message: options.message.replace(/\u001b\[.*?m/g, ''),
                 durationMs: options.meta.durationMs, timestamp: moment().format('lll')});
          },
          level: 'debug',
          filename: config.fileName,
          //handleExceptions: true,
          json: false,
          maxsize: 5242880, //5MB
          maxFiles: 5,
          colorize: false
      }
    });

    this[name] = winston.loggers.get(name);
    return this[name];

  }
}


module.exports = new logger;

