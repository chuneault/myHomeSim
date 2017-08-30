"use strict";

/**
 * Created by chune on 2016-10-14.
 */
require('colors');

var readline = require('readline')
    , controller
    , vm = require('vm')
    , _ = require('lodash')
    , s = require('string')
    , rl = readline.createInterface(process.stdin, process.stdout, completer)
    , util = require('util')
    , activePrompt = {prompt: '>', activeObj: null}
    , moment = require('moment')
    , help = ['.help                      ' + 'display help.'.yellow
      , '.get device/node/sensor/var    '
      , '.send value                '
      , '.q[uit]                    ' + 'exit console.'.grey
    ].join('\n')
    ;

var serializeObj = function (obj) {
  return _.omitBy(obj, function (val, key) {
    return (_.startsWith(key, '__'));
  });
};

function completer(line) {
  if (line == '') {
    console.log(activePrompt);
    return '';
  }
  else {
    let argv = s(line.toString()).parseCSV(' ', '\'');
    let completions='.help/.get/.req/.set/.quit/.info'.split('/');
    if (argv) {
      if ((argv.length > 0) && (argv[0] == '.get')) {
        completions = 'device/node/sensor/var'.split('/');
        line = argv[1];
      }
      if ((argv.length >= 2) && (argv[0] == '.get') && (argv[1] == 'var')) {
        completions = _.keys(controller.vars);
        if (argv[2]) line = argv[2];
      }
      else if ((argv.length >= 2) && (argv[0] == '.get') && (argv[1] == 'sensor')) {
        if (activePrompt.objType == 'node') {
          completions = _.map(activePrompt.activeObj[0].__sensors, 'name');
        }
        if (argv[2]) line = argv[2];
      }
      else if ((argv.length >= 2) && (argv[0] == '.get') && (argv[1] == 'node')) {
        if (activePrompt.objType == 'device') {
          completions = _.map(activePrompt.activeObj[0].__nodes, 'name');
        }
        if (argv[2]) line = argv[2];
      }
      else if ((argv.length >= 2) && (argv[0] == '.get') && (argv[1] == 'device')) {
        completions = _.map(controller.devices, 'name');
        console.log(completions);
        if (argv[2]) line = argv[2];
      }

    }


    var hits = completions.filter(function (c) {
      if (c.indexOf(line) == 0) {
        return c;
      }
    });
    return [hits && hits.length ? hits : completions, line];
  }
}

function welcome() {
  console.log(["= myHomeSim Shell Console "
    , "= Welcome, enter .help for list of command"
  ].join('\n').grey);
  prompt();
}

function prompt() {
  rl.setPrompt(activePrompt.prompt.grey, activePrompt.prompt.length);
  rl.prompt();
}

function parseParams(filter, callback) {
  try {
    if ((filter) && (filter != 'all'))
      return callback(null, vm.runInThisContext('params = ' + filter));
    else
      return callback(null, '');

  }
  catch (err) {
    return callback('filter syntax error '.white + '\n' + err.message.bold.red);
  }
}

function getObject(list, filter, type) {
  parseParams(filter, function (error, params) {
    if (error)
      console.log(error);
    else {
      console.log(params);
      var devices = _.filter(list, params);
      if ((devices) && (devices.length > 0)) {
        if (devices.length == 1) {
          activePrompt.prompt = util.format('[%s]>', devices[0].name.white);
        } else {
          var devicesName = _.map(devices, 'name');
          activePrompt.prompt = util.format('[%s]>', devicesName.join(',').white);
        }
        activePrompt.activeObj = devices;
        activePrompt.objType = type;
      } else
        console.log(type, 'not found'.bold.red);
    }
    prompt();
  });
}

function getVar(list, varName, type) {
  console.log(varName.bold.green);
  var varObj = list[varName];
  if (varObj) {
    activePrompt.prompt = util.format('[%s]>', varName.white);
    activePrompt.activeObj = [varObj];
    if (varObj.__type)
      activePrompt.objType = varObj.__type;
    else
      activePrompt.objType = type;
  } else
    console.log(varName, 'not found'.bold.red);
  prompt();
}

function sendMessage(sensor, msgVal) {
  console.log('send Message val', msgVal, 'to', sensor.name);
  sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, 2, msgVal);
}

function exec(command) {
  var cmdArray = s(command).parseCSV(' ', '\'');

  switch (cmdArray[0]) {
    case '.get':
      if (cmdArray[1] == 'device')
        getObject(controller.devices, cmdArray.slice(2).join(' '), 'device');
      else if (cmdArray[1] == 'node')
        getObject(activePrompt.activeObj[0].__nodes, cmdArray.slice(2).join(' '), 'node');
      else if (cmdArray[1] == 'sensor')
        getObject(activePrompt.activeObj[0].__sensors, cmdArray.slice(2).join(' '), 'sensor');
      else if (cmdArray[1] == 'var')
        getVar(controller.vars, cmdArray.slice(2).join(' '), 'var');
      else
        console.log('invalid .get parameter'.bold.red);
      break;
    case '.set' :
      if ((activePrompt.activeObj) && (activePrompt.objType == 'sensor'))
        _.forEach(activePrompt.activeObj, function(sensor) {
          console.log(controller.addSensorValue(sensor, cmdArray.slice(1).join(' ')));
        });
      prompt();
      break;

    case '.reboot' :
      if ((activePrompt.activeObj) && (activePrompt.objType == 'node'))
        _.forEach(activePrompt.activeObj, function(node) {
          node.__ownerDevice.reboot(node, false);
        });
      prompt();
      break;

    case '.rebootNow' :
      if ((activePrompt.activeObj) && (activePrompt.objType == 'node'))
        _.forEach(activePrompt.activeObj, function(node) {
          node.__ownerDevice.reboot(node, true);
        });
      prompt();
      break;

    case '.send' :
      if ((activePrompt.activeObj) && (activePrompt.objType == 'sensor'))
        _.forEach(activePrompt.activeObj, function(sensor) {
          sendMessage(sensor, cmdArray.slice(1).join(' '));
        });
      prompt();
      break;
    case '.list':
      if ((cmdArray.length > 1) && (cmdArray[1] == 'var')) {
        console.log(_.keys(controller.vars));
      }
      break;
    case '.info':
      if ((cmdArray.length > 1) && (cmdArray[1] == 'var')) {
        let node = controller.vars[cmdArray[2]];
        console.log(node.toString());
      }
      else if ((cmdArray.length > 1) && (cmdArray[1] == 'varlog')) {
        let node = controller.vars[cmdArray[2]];
        node.__log.query({json: false, order: 'desc'}, function (err, results) {
          _.forEach(results.memory, function (info) {
            console.log(util.format('%s - %s - %s - %s', moment(info.timestamp).format('lll'), info.message, info.level, info.type));
          });
        });
      }
      else if (activePrompt.activeObj) {
        if (_.isArray(activePrompt.activeObj)) {
          _.each(activePrompt.activeObj, function (obj) {
            if (cmdArray[1] == 'log')
              obj.__log.query({json: true, order: 'desc'}, function (err, results) {
                _.forEach(results.memory, function (info) {
                  console.log(util.format('%s - %s - %s - %s', moment(info.timestamp).format('YY/MM/DD, h:mm:ss a'), info.message, info.level, info.type));
                });
              });
            else if (cmdArray[1] == 'obj')
              console.log(obj);
            else if (cmdArray[1] == 'full')
              console.log(serializeObj(obj));
            else
              console.log(obj.toString());
          });
        }
        else {
          if (cmdArray[1] == 'log')
            activePrompt.activeObj.__log.query({json: true, order: 'desc'}, function (err, results) {
              _.forEach(results.memory, function (info) {
                console.log(util.format('%s - %s - %s - %s', moment(info.timestamp).format('lll'), info.message, info.level, info.type));
              });
            });
          else if (cmdArray[1] == 'full')
            console.log(activePrompt.activeObj);
          else
            console.log(activePrompt.activeObj.toString());
        }
      }
      else
        console.log('not device/sensor selected'.bold.red);
      break;

    case '.invoke':
      var argv = require('minimist')(cmdArray.slice(3));
      controller.invokeAction(cmdArray[1], cmdArray[2], _.values(argv)[0]);
      break;
    case '.run':
      let sensor = activePrompt.activeObj[0];
      controller.runScript(cmdArray[1], {sensor: sensor,
        value: sensor.lastValue});
      break;

    case '.help':
      console.log(help.yellow);
      break;
    case '.exit':
    case '.quit':
    case '.q':
      process.exit(0);
      break;


    default :
      console.log('invalid command'.yellow);
      break;
  }
}

rl.on('line', function (cmd) {
  exec(cmd.trim());
}).on('close', function () {
  // only gets triggered by ^C or ^D
  console.log('goodbye!'.green);
  process.exit(0);
}).on('SIGINT', function () {
  rl.question('Are you sure you want to exit? '.bold.red, function (answer) {
    if (answer.match(/^y(es)?$/i)) {
      rl.close();
      process.exit(0);
    }
  })
});

process.on('uncaughtException', function (e) {
  console.log(e.stack.bold.red);
  rl.prompt();
});


// Helpful thing I didn't get around to using:
// Make sure the buffer is flushed before
// we display the prompt.
function flush(callback) {
  if (process.stdout.write('')) {
    callback();
  } else {
    process.stdout.once('drain', function () {
      callback();
    });
  }
}


var plugins = require("../../lib/hsPlugins.js");

class consoleShell extends plugins {
  constructor(server, params) {

    controller = server;

    super(server, params);

    welcome();

    /*setTimeout(function(){
     getObject(controller.sensors,'{}');
     }, 5000);
     */

  }
}
;

exports.connect = function (pluginType, params, callback) {
  //console.log('I belong to ' + pluginType);
  callback({
    name: 'consoleShell',
    params: params,
    pluginClass: consoleShell
  });
};

