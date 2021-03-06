/**
 * Created by chune on 10/26/2016.
 */

"use strict";

const _ = require('lodash');
const plugins = require("../../lib/hsPlugins.js");

class httpServer extends plugins {

   generateInteraction(interaction) {
     var self = this;
     var orValues = [];
     var regEx = /([\[\]])\1|[\[](.*?)(?:!(.+?))?[\]]/g;
     var orVal;

     while ((orVal = regEx.exec(interaction.question)) !== null) {
       var orVals = orVal[2].split('|');
       orValues.push({or: orVal[0], vals: orVals});
     }

     regEx = /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g;
      while ((orVal = regEx.exec(interaction.question)) !== null) {
        if (orVal[0] == '{object}') {
          var filter = _.filter(self.__controller.sensors, interaction.filter);
          orValues.push({or: orVal[0], vals: _.map(filter, function(sensor){return sensor.__ownerNode.name}), obj: filter });
        }
      }


     var generate = function (index, orValues, question, result) {
       _.forEach(orValues[index].vals, function (value, i) {
         var synonymous=[value];
         if (interaction.synonymous[value])
           synonymous = synonymous.concat(interaction.synonymous[value]);
         _.forEach(synonymous, function (value) {
           result = _.replace(question, orValues[index].or, value);
           if (index < orValues.length - 1)
             generate(index + 1, orValues, result, result);
           else {
             let s = _.lowerCase(_.deburr(result));
             console.log(s.bold.green);
             self.allInteraction.push({question: s, obj: orValues[index].obj[i], answer: interaction.answer, answerEval: interaction.answerEval, answerAction: interaction.answerAction});
           }
         })
       });
     };

     generate(0, orValues, interaction.question, interaction.question);
   }


  constructor(controller, params) {

    super(controller, params);

    var self = this;

    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');

    var appRoot = require('app-root-path');

    //app.use(express.static(appRoot + '/html'));

    //app.use('/static', express.static(appRoot + '/bower_components'));
    //app.use('/dist/colorpicker', express.static(appRoot + '/node_modules/bootstrap-colorpicker/dist'));
    //app.use('/dist/colorpickersliders', express.static(appRoot + '/html/components/colorpickersliders/dist'));


    var server = require('http').Server(app);
    var io = require('socket.io')(server);

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    //app.set('view engine', 'pug');

    app.set('view engine', 'html');
    app.engine('html', require('ejs').renderFile);
    app.engine('js', require('ejs').renderFile);

    // use morgan to log requests to the console
    //app.use(morgan('dev'));
    //app.use(require('morgan')("dev", { stream: logger.stream }));

    //disable Nagle
    app.use(function (req, res, next) {
      req.connection.setNoDelay(true);
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      next();
    });

    app.get('/api', function (req, res) {
      res.send('Hello from myHomeSim!');
    });

    app.get('/', function (req, res) {
      res.render(appRoot + '/html/index.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.use(express.static(appRoot + '/html'));

    app.get('/dashboard', function (req, res) {
      res.render(appRoot + '/html/index.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.get('/nodes', function (req, res) {
      res.render(appRoot + '/html/nodes.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.get('/myUtils.js', function (req, res) {
      res.render(appRoot + '/html/js/myUtils.js', {myHomeSiteApiURL: self.params.apiUrl});
    });


    /*app.get('/jade', function (req, res) {

      res.render('index.pug', { title: 'Hey', message: 'Hello there!',
          test: [{nom: 'Huneault', prenom: 'Carl'},
                 {nom: 'Huneault', prenom: 'Lauralie'}
                 ]});
    });*/

    io.on('connection', function (socket) {
      //socket.emit('news', { hello: 'world' });
      //socket.on('my other event', function (data) {
      //  console.log(data);
      //});
    });

    this.allInteraction = [];
    let ctrl = self.__controller;

    var serializeObj = function (obj) {
      return _.omitBy(obj, function (val, key) {
        return (_.startsWith(key, '__'));
      });
    };

    ctrl.on('loadDBCompleted', function () {

      /*

      self.generateInteraction({
        question: '[quelle est|c\'est quoi] [la| ] température [a |de la chambre a |du |de |de la |de l\']{object}',
        filter: {name: 'S_TEMP'},
        synonymous: {'LAURALIE': ['l\'eau rallye', 'lolo', 'l\'eau l\'eau'],
                     'CHARLINE': ['charlene'],
                     'METEO': ['l\'extérieur'],
                     'BELL/TEMP/REPEATER': ['maison']
                    },
        answer: 'la température est de {value} degré celsius'
      });
      self.generateInteraction({
        question: '[quelle est|c\'est quoi] le taux d\'humidité [de la chambre a |du |de |de la |de l\']{object}',
        filter: {name: 'S_HUM'},
        synonymous: {'LAURALIE': ['l\'eau rallye', 'lolo', 'l\'eau l\'eau'], 'Meteo': ['l\'extérieur']},
        answer: 'le taux d\'humidité est de {value} pourcent'
      });

      self.generateInteraction({
        question: '[est-ce] que [le|les] {object} [est|sont] allumé',
        filter: {name: 'S_BINARY'},
        synonymous: {'RELAY': ['sapin', 'sapins']},
        answerEval: '{value} == 1 ? "oui il est allumé" : "non il est éteint"'
      });

      self.generateInteraction({
        question: 'est ce que [le|la|les] {object} est [allumé|ouvert]',
        filter: {name: 'S_BINARY'},
        synonymous: {'RELAY': ['sapins', 'sapin', 'sapin de noel']},
        answerEval: '{value} == 1 ? "il est allumé" : "il est éteint"'
      });

      self.generateInteraction({
        question: '[allume|ouvre] [le|la|les] {object}',
        filter: {name: 'S_BINARY'},
        synonymous: {'RELAY': ['sapins', 'sapin', 'sapin de noel']},
        answerAction: '1',
        answer: 'le sapin est maintenant allumé'
      });

      self.generateInteraction({
        question: '[éteint|ferme] [le|la|les] {object}',
        filter: {name: 'S_BINARY'},
        synonymous: {'RELAY': ['sapins', 'sapin', 'sapin de noel']},
        answerAction: '0',
        answer: 'le sapin est maintenant fermé'
      });

      */

      ctrl.on('newSensorValue', function (sensor, value) {
        io.emit('newSensorValue', serializeObj(sensor));
      });

      ctrl.on('updateNode', function (node) {
        io.emit('updateNode', serializeObj(node));
      });


    });

    app.get('/api/query/:question', function (request, response){
      var utf8 = require('utf8');
      var question = utf8.decode(request.params.question);
      console.log('query question',  question.yellow.green);
      question = _.lowerCase(_.deburr( question ));
      console.log('searching for', question.bold.green);
      var found = _.find(self.allInteraction, {question: question});
      if (found) {
        var val = found.obj.lastValue.toString().replace('.', ' point ');

        if (found.answerAction)
          found.obj.__ownerNode.__ownerDevice.send(found.obj.__ownerNode, found.obj, 2, found.answerAction);
        if (found.answer)
          response.end(found.answer.replace('{value}', val ));
        if (found.answerEval)
          response.end(eval(found.answerEval.replace('{value}', val)));

      } else
        response.end('interraction non trouvé');
    });

    app.get('/api/nodes', function (request, response){
      let result = [];
      if  (request.params.filter)
        result = _.filter(ctrl.nodes, request.params.filter);
      _.forEach(ctrl.nodes, function(node){
        result.push(serializeObj(node));
      });
      response.json(result);
    });

    app.get('/api/nodes/:filter', function (request, response){
      console.log('searching for', request.params.filter.bold.green);
      let result = [];
      _.forEach(_.filter(ctrl.nodes, JSON.parse(request.params.filter)), function(node){
        result.push(serializeObj(node));
      });
      response.json(result);
    });

    app.get('/api/node/:_nodeId', function (request, response){
      response.json(serializeObj(ctrl.nodes[request.params._nodeId]));
    });

    app.get('/api/node/:_nodeId/reboot', function (request, response){
      let node = ctrl.nodes[request.params._nodeId];
      if (node) {
        node.__ownerDevice.reboot(node, false);
        response.end('Stack reboot node msg to ' + node.name);
      }
      else
        response.status(412).send('node not found');
    });

    app.post('/api/node/:_nodeId', function (request, response){

      var node = ctrl.nodes[request.params._nodeId];
      if (node) {

        _.forEach(request.body, function(val, key){
          if ((typeof request.body[key] == 'string') && (val == ''))
            request.body[key] = null;
          else
            if ((typeof request.body[key] == 'string') && (Number(val) + 0 == val))
              request.body[key] = Number(val);
        });

        console.log(request.body);

        ctrl.updateNode(node, request.body);
        response.status(200).send('node updated');
      }
      else
        response.status(412).send('node not found');
    });

    app.delete('/api/node/:_nodeId', function (request, response){

      var node = ctrl.nodes[request.params._nodeId];
      if (node) {

        ctrl.deleteNode(node);
        response.status(200).send('node deleted');
      }
      else
        response.status(412).send('node not found');
    });

    app.get('/api/sensors/:_nodeId', function (request, response){
      //console.log('searching for', request.params.filter.bold.green);
      let result = [];
      _.forEach(ctrl.nodes[request.params._nodeId].__sensors , function(sensor){
        result.push(serializeObj(sensor));
      });
      response.json(result);
    });

    app.get('/api/sensor/:_sensorId', function (request, response){
      response.json(serializeObj(ctrl.sensors[request.params._sensorId]));
    });

    app.put('/api/sensor/:_sensorId/:_msgType', function (request, response){
      var sensor = ctrl.sensors[request.params._sensorId];
      if (sensor) {
        console.log('send message to node', request.body);
        sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, request.params._msgType, request.body.value);
        response.status(200).send('send message to node ' + sensor.__ownerNode.name+ ', msgType: ' + request.params._msgType + ', msgVal: ' + request.body.value);
      }
      else
        response.status(412).send('sensor not found');
    });

    app.post('/api/sensor/:_sensorId', function (request, response){

      var sensor = ctrl.sensors[request.params._sensorId];
      if (sensor) {

        _.forEach(request.body, function(val, key){
          if ((typeof request.body[key] == 'string') && (val == ''))
           request.body[key] = null;
          else
            if ((typeof request.body[key] == 'string') && (Number(val) + 0 == val))
              request.body[key] = Number(val);
        });

        console.log(request.body);

        ctrl.updateSensor(sensor, request.body);
        response.status(200).send('sensor updated');
      }
      else
        response.status(412).send('sensor not found');
    });


    app.get('/api/sensor/:_sensorId/values', function (request, response){
      var sensor = ctrl.sensors[request.params._sensorId];
      response.json(serializeObj(sensor.__values));
    });

    app.get('/api/sensor/:_sensorId/dbvalues', function (request, response){
      var sensor = ctrl.sensors[request.params._sensorId];
      var where =  {_sensorId: sensor._id};
      if (request.query.minValueDate)
        where.valueDate = {$gte: _.parseInt(request.query.minValueDate)};
      if (request.query.maxValueDate)
        where.valueDate = {$lte: _.parseInt(request.query.maxValueDate)};
      var sensorsVal = ctrl.__db.sensorsVal.find(where).sort({ valueDate: 1 }).limit(request.query.limit || 9999999999);
      sensorsVal.exec().then(function(vals) {
        response.json(serializeObj(vals));
      });
    });

    server.listen(self.params.port || 8080, function(){
        //Callback triggered when server is successfully listening. Hurray!
        console.log("Server listening on: http://localhost:%s", self.params.port || 8080);
      });
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'httpServer',
    params: params,
    pluginClass: httpServer
  });
};



