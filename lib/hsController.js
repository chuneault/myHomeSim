"use strict";

/**
 * Created by chune on 2016-10-11.
 */

require('colors');
const vm      = require('vm'),
      util    = require('util'),
      format  = require('string-format'),
      shortId = require('shortid'),
      _       = require('lodash'),
      s       = require('string'),
      moment  = require('moment');


String.prototype.stripColor = function(includeColor) {
  if (includeColor == false)
    return this.toString().strip;
  else
    return this.toString();
};

function roundNumber(num, scale) {
  var number = Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale);
  if(num - number > 0) {
    return (number + Math.floor(2 * Math.round((num - number) * Math.pow(10, (scale + 1))) / 10) / Math.pow(10, scale));
  } else {
    return number;
  }
}

class hsController {

  constructor(logger, config) {
    this.config = config;
    this.devices = {};
    this.nodes = {};
    this.sensors = {};

    this.objects = {};
    this.vars = {};
    this.logger =  logger;
    this.log = logger['core'];
    this.loadDBCompletedDone = false;

    const events = require('events');
    this.event = new events;
    this.event.setMaxListeners(100);

      //on new day
      let schedule = require('node-schedule');
      let self = this;
      schedule.scheduleJob('0 0 * * *', function () {
          console.log('another day begin!');
          self.event.emit('newDay');
      });
  };

  on(eventName, fnc) {
    this.event.on(eventName, fnc);
  };

  checkNodeHeartBeat() {
    var self = this;
    var check = function(nodes) {
      let nodeExpired = _.filter(nodes, function (node) {
        return ( (!node.__alertSended) && (node.maxDelayHeartBeat > 0) && (  (node.lastHeartBeat + node.maxDelayHeartBeat * 1000) <= _.now() ))
      });

      if (nodeExpired.length > 0) {

        _.forEach(nodeExpired, function(node) {
          node.__alertSended = _.now()
          node.__ownerDevice.__controller.invokeAction('pushBullet', 'sendMessage', ['Warning',
              format('Last Heart Beat for {} was {}', node.name, moment(node.lastHeartBeat).fromNow())
          ]);
          console.log('Please Check Last Heart Beat'.bold.red, 'for', node.name.bold.green, 'since:', moment(node.lastHeartBeat).fromNow().bold.yellow);
          self.event.emit('nodeExpired', node);

        });
      }

      setTimeout(function(){check(nodes)}, 1000);
    };
    check(this.nodes);
  }

  loadDBCompleted(){
    this.loadDBCompletedDone = true;
    this.event.emit('loadDBCompleted');
    //this.checkNodeHeartBeat();
  }

  addDevice(newDevice) {
    let hasId;
    if (!(hasId = newDevice._id)) newDevice._id = shortId.generate();
    newDevice.__nodes = {};
    newDevice.__log = this.logger.addLoggerMemory( newDevice._id);
    this.devices[newDevice._id] = newDevice;
    /*if (!hasId)
      this.event.emit('newDevice', newDevice);*/
    return newDevice;
  };

  findDevice(filter, callback) {
    var found = _.find(this.devices, filter);
    if (callback) {
      if (found)
        callback(null, found);
      else
        callback('no node found');
    } else
      return found;
  }

  /*
  getNodeInfoJSON() {
    let result = '';
    result = JSON.stringify(this);
    _.each(this.sensors, function(sensor){
      result = result + '\n' + sensor.toJSON();
    });
    return result;
  }*/

  getNodeInfo(includeColor){

    //let result = JSON.stringify(serializeObj(this), null, ' ');

    let result;
    let node = this;
    result = format('{name}\n\tBattery Level: {bat}\n\tLast Heart Beat: ({sinceheart})\n\tLast Update: ({since})\n' + 'Sensors'.bold.yellow.stripColor(includeColor),
        {name: node.name.bold.yellow.stripColor(includeColor),
         bat: node.batteryLevel ? node.batteryLevel.toString().bold.green.stripColor(includeColor) + '%' : 'n/a',
         sinceheart: node.lastHeartBeat ? moment(node.lastHeartBeat).fromNow().gray.stripColor(includeColor) : 'n/a',
         since: node.lastUpdate ? moment(node.lastUpdate).fromNow().gray.stripColor(includeColor) : '????'
        });
    _.each(this.__sensors, function(sensor){
      if (sensor.visible != false)
        result = result + '\n\t' + sensor.toString(includeColor);
    });



    return result;
  }

  addNode(newNode, ownerDevice) {
    let hasId;
    newNode.__sensors = {};
    newNode.__ownerDevice = ownerDevice;
    newNode.type = 'node';
      newNode.toString = this.getNodeInfo;

      if (newNode._rev)
          delete newNode._rev;

      if (!(hasId = newNode._id)) newNode._id = shortId.generate();

    newNode.lastUpdate = _.now();

    newNode.__log = this.logger.addLoggerMemory( newNode._id);

    if (ownerDevice) {
      ownerDevice.__nodes[newNode._id] = newNode;
      newNode.deviceId = ownerDevice._id;
    }

    this.nodes[newNode._id] = newNode;

    if (newNode.varName)
      this.addVar(newNode.varName, newNode);

    if (!hasId)
      this.event.emit('newNode', newNode);
    return newNode;
  };

  updateNode(node, updateProperties) {

    if (updateProperties.vendor) {
        if (node.vendor)
            _.extend(node.vendor, updateProperties.vendor);
        else
            node.vendor = updateProperties.vendor;
        delete (updateProperties.vendor);
    }
    _.extend(node, updateProperties, {lastUpdate: _.now(), lastHeartBeat: _.now()});

    this.event.emit('updateNode', node);
    return node;
  }

  deleteNode(node, updateProperties) {
    let ctrl = this;
    _.forEach(node.__sensors , function(sensor){
      delete ctrl.sensors[sensor._id];
    });
    delete ctrl.nodes[node._id];
    this.event.emit('deleteNode', node);
    return true;
  }

  getNode(_id) {
    return this.nodes[_id];
  }

  findNode(filter, callback) {
    var found = _.find(this.nodes, filter);
    if (callback) {
      if (found)
        callback(null, found);
      else {
          callback('no node found');
          console.log('no node found', filter);
      }
    } else
     return found;
  };

  addOrUpdateNode(filter, nodeProperties, ownerDevice, callback) {
    var self = this;
    self.findNode(filter, function(notFound, node) {
      if (notFound)
        node = self.addNode(nodeProperties, ownerDevice);
      else
        node = self.updateNode(node, nodeProperties);
      if (callback)
         callback(null, node);
    });
  }

  addOrGetNode(filter, nodeProperties, ownerDevice, callback) {
    var self = this;
    self.findNode(filter, function(notFound, node) {
      if (notFound)
        node = self.addNode(nodeProperties, ownerDevice);
      if (callback)
        callback(null, node);
    });
  }

  /*getSensorInfoJSON() {
    return JSON.stringify(this);
  }*/

  getSensorInfo(includeColor) {
    //let result = JSON.stringify(serializeObj(this), null, ' ');
    let result = format('{desc} {name}\n\tLast Value: {lastval} ({lastsince})\n\tPrevious Value: {prevval} ({prevsince})',
        { desc: (this.desc ? this.desc.bold.green.stripColor(includeColor) : ''),
          name: this.name ? this.name.bold.green.stripColor(includeColor) : "unknow".bold.green.stripColor(includeColor),
          lastval: this.lastValue != null ? this.lastValue.toString().bold.yellow.stripColor(includeColor) : '',
          lastsince: moment(this.lastDate).fromNow().gray.stripColor(includeColor),
          prevval: this.previousValue,
          prevsince: moment(this.previousValueDate).fromNow().gray.stripColor(includeColor)
        });
    return result;
  }

  addSensor(newSensor, ownerNode) {
    if (this.loadDBCompletedDone) {
        debugger;
    }
    let hasId;
    if (!(hasId = newSensor._id)) newSensor._id = shortId.generate();
    newSensor.__values = [];
    newSensor.__ownerNode = ownerNode;
    newSensor.type = 'sensor';
    if (newSesor._rev)
      delete newSesor._rev;
    //newSensor.toJSON = this.getSensorInfoJSON;
    newSensor.toString = this.getSensorInfo;
    newSensor.__log = this.logger.addLoggerMemory( newSensor._id);

    newSensor.nodeId = ownerNode._id;
    this.sensors[newSensor._id] = newSensor;
    if (ownerNode)
      ownerNode.__sensors[newSensor._id] = newSensor;

    if (newSensor.varName)
      this.addVar(newSensor.varName, newSensor);

    if (!hasId)
      this.event.emit('newSensor', newSensor);
    return newSensor;
  };

  addOrUpdateSensor(filter, sensorProperties, ownerNode, callback) {
    var self = this;
    self.findSensor(filter, function(notFound, sensor) {
      if (notFound)
        sensor = self.addSensor(sensorProperties, ownerNode);
      else
        sensor = self.updateSensor(sensor, sensorProperties);
      if (callback)
        callback(null, sensor);
    });
  }

  updateSensor(sensor, updateProperties) {
    if (updateProperties.vendor) {
        if (sensor.vendor)
            _.extend(sensor.vendor, updateProperties.vendor);
        else
            sensor.vendor = updateProperties.vendor;
        delete (updateProperties.vendor);
    }
    _.extend(sensor, updateProperties);
    this.event.emit('updateSensor', sensor);
    if ((sensor.varName) && (!this.vars[sensor.varName]))
      this.addVar(sensor.varName, sensor);
    return sensor;
  }

  findSensor(filter, callback) {
    var found = _.find(this.sensors, filter);
    if (callback) {
      if (found)
        callback(null, found);
      else {
          callback('no sensor found');
          console.log('no sensor found', filter);
      }
    } else
      return found;
  };

  addSensorValue(sensor, value) {

    if (sensor.offset) {
      const sandbox = {value: value};
      vm.createContext(sandbox);
      vm.runInContext(sensor.offset, sandbox);
      value = sandbox.value;
    }

    if (sensor.precision) value = roundNumber(value, sensor.precision);

    var val = {
      value: value,
      valueDate: _.now()
    };

    this.updateSensor(sensor,
          {
            previousValue: sensor.lastValue,
            previousValueDate: sensor.lastDate,
            lastValue: value,
            lastDate: val.valueDate
          }
         );
    sensor.__values.push(val);

    if (sensor.actionOnChange) {
      if (sensor.lastValue != sensor.previousValue) {
        var actionsargv = s(sensor.actionOnChange).parseCSV();
        this.invokeAction(actionsargv[0], actionsargv[1], actionsargv.slice(2));
      }
    }

    if (sensor.scriptOnChange) {
      this.runScript(sensor.scriptOnChange, {sensor: sensor,
         value: sensor.lastValue});
    }

    this.event.emit('newSensorValue', sensor, val);
    return val;
  }

  addObject(name, object) {
    this.objects[name] = object;
  }

  addVar(name, object) {
    this.vars[name] = object;
  }

  runScript(script, sandboxVar) {
    var fs = require('fs');
    this.log.profile('run script');
    this.log.info('Running script', script);
    //let runScript = format(script, this.vars);
    let runScript = script;
    if (this.vars[runScript])
      runScript = this.vars[runScript];
    if ((runScript.type == 'script') && (runScript.script))
      runScript = runScript.script;
    else
    if ((runScript.type == 'script') && (runScript.scriptFileName))
      runScript = fs.readFileSync(runScript.scriptFileName, 'utf8');

    const sandbox = _.extend({server: this,
                              format:  require('string-format'),
                              setTimeout: setTimeout,
                              clearTimeout: clearTimeout,
                              moment: moment,
                              require: require,
                              _: _,
                              console: console}, sandboxVar);
    vm.createContext(sandbox);
    vm.runInContext(runScript, sandbox);
    this.log.profile('run script');
  }

  invokeAction(name, method, arrayArgv) {
    let classObj;
    if (classObj = this.objects[name]) {
      this.log.profile('run action');
      this.log.info('Running action', name, method);
      var obj = classObj.class;
      obj[method].apply(obj, arrayArgv);
      this.log.profile('run action');
    }
  }
}

 module.exports = hsController;


