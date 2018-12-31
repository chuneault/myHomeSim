/**
 * Created by chune on 10/26/2016.
 */

"use strict";

const _ = require('lodash'),
      plugins = require("../../lib/hsPlugins.js"),
      assert = require('assert'),
      querystring = require('querystring');

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
             //console.log(s.bold.green);
             self.allInteraction.push({question: s, obj: orValues[index].obj[i], answer: interaction.answer, answerEval: interaction.answerEval, answerAction: interaction.answerAction});
           }
         })
       });
     };

     generate(0, orValues, interaction.question, interaction.question);
   }

  constructor(controller, params) {

    super(controller, params);

    let self = this;

    /*var users = [
          { id: 1, username: 'admin', password: 'secret', email: 'chuneault@gmail.com', apikey: 'asdasjsdgfhgdsfjkjhg' }
      ];*/


    const express = require('express'),
          passport = require('passport'),
          bodyParser = require('body-parser'),
          appRoot = require('app-root-path'),
          session = require('express-session'),
          fileUpload = require('express-fileupload'),
          mongoose = require('mongoose'),
          MongoStore = require('connect-mongo')(session),
          GoogleStrategy = require('passport-google-oauth20').Strategy;

      var User = require('./user.js')(self.params.mongoDBSession);

      let app = express();

      //connect to MongoDB
      //mongoose.connect(self.params.mongoDBSession, { socketTimeoutMS: 0, keepAlive: true, reconnectTries: 5 });
      //let db = mongoose.connection;

      //handle mongo error
      //db.on('error', console.error.bind(console, 'connection error:'));

      app.use(passport.initialize());
      app.use(session({
        secret: 'work hard',
        resave: true,
        saveUninitialized: false
        /*store: new MongoStore({
            mongooseConnection: db
        })*/
    }));

    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });

    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    });


    app.use(fileUpload());

    function findById(id, fn) {
          var idx = id - 1;
          if (users[idx]) {
              fn(null, users[idx]);
          } else {
              fn(new Error('User ' + id + ' does not exist'));
          }
      }

    function findByApiKey(apikey, fn) {
          for (var i = 0, len = users.length; i < len; i++) {
              var user = users[i];
              if (user.apikey === apikey) {
                  return fn(null, user);
              }
          }
          return fn(null, null);
      }

    function checkIntegerProp(obj) {

        _.forEach(obj, function(val, key){
            if ((typeof obj[key] == 'string') && (val == ''))
                obj[key] = null;
            else
            if ((typeof obj[key] == 'string') && (Number(val) + 0 == val))
                obj[key] = Number(val);
            else
            if ((typeof obj[key] == 'string') && ((val == "true") || (val == "false")))
                obj[key] = (val == "true" ? true : false);
            else
              if (typeof obj[key] == 'object')
              checkIntegerProp(obj[key]);
        });
    }


    var server = require('http').Server(app);
    var io = require('socket.io')(server);

    this.io = io;

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    //app.set('view engine', 'pug');

    app.set('view engine', 'html');
    app.engine('html', require('ejs').renderFile);
    app.engine('js', require('ejs').renderFile);



    let googleStrategy = new GoogleStrategy({
            clientID: self.params.googleClientID,
            clientSecret: self.params.googleClientSecret,
            callbackURL: "http://home.huneault.ca/auth/google/callback"
            },
              function(accessToken, refreshToken, profile, cb) {
               User.authenticate(profile.id, profile._json, cb);
            });

    passport.use(googleStrategy);

      app.get('/auth/google',
          passport.authenticate('google', { scope: ['profile'] }));

      app.get('/auth/google/callback',
          passport.authenticate('google', { failureRedirect: '/login' }),
          function(req, res) {
              // Successful authentication, redirect home.
              res.redirect('/index.html');
          });


      function ensureAuthenticated(req, res, next) {
          //console.log('ensureAuthenticated', req.headers.host);
          if ((req.session.passport)  && (req.session.passport.user)) {
              //console.log(req.session.passport.user);
              return next();
          }
          // denied. redirect to login
          googleStrategy._callbackURL = 'http://' + req.headers.host + '/auth/google/callback';
          res.redirect('/auth/google')
      }


      app.use(ensureAuthenticated, function (req, res, next) {
          req.connection.setNoDelay(true);
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          next();
      });

      app.use(express.static(appRoot + '/html'));

      app.get('/api', function (req, res) {
        res.send('Hello from myHomeSim!');
      });

      /*app.get('/espeasy/:sysname', function (req, res) {
          console.log('Hello from espeasy!');
          console.log(req.params.sysname);
          res.send('OK');
      });

      app.get('/espeasy/:sysname/:taskname/:valname/:value', function (req, res) {
          console.log('Hello from espeasy!');
          console.log(req.params);
          res.send('OK');
      });*/

     app.get('/',  function (req, res) {
       console.log('index.html');
       res.render(appRoot + '/html/index.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.get('/dashboard', function (req, res) {
      res.render(appRoot + '/html/index.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.get('/dashboardv2', function (req, res) {
        res.render(appRoot + '/html/dashboardv2.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.get('/piscine', function (req, res) {
        res.render(appRoot + '/html/piscine.html', {myHomeSiteApiURL: self.params.apiUrl});
    });

    app.get('/display/:filter?', async function (req, res) {

        let resultDisplay = {};
        let resultData = {};
        let tags = {};

        let addDisplay = function(display, data) {

            if ((display.visible == null) || (display.visible != false)) {

                let owner;
                if (display.template) {
                    if (resultDisplay[display.template])
                        owner = resultDisplay[display.template];
                    else {
                        owner = [];
                        resultDisplay[display.template] = owner;
                    }
                    delete display.template;
                }

                let addItem = function (item, owner = null, pushProperty = 'items') {

                    if (item.tagId)
                        tags[item.tagId] = item;

                    if (item.body)
                        _.forEach(item.body, function(bodyItem){
                            addItem(bodyItem, null, 'body');
                        });

                    if (item.options)
                        _.forEach(item.options, function(options){
                            addItem(options, null, 'options');
                        });

                    if (item.ownerTagId) {
                        let ownerItem = tags[item.ownerTagId];
                        if (!ownerItem) {
                            console.log('ownerItem not Found', item.ownerTagId, item);
                            return false;
                        }
                        if (!ownerItem[pushProperty])
                            ownerItem[pushProperty] = [];
                        delete item.ownerTagId;
                        ownerItem[pushProperty].push(item);
                    }
                    else {
                        if (owner) owner.push(item);
                    }

                    if ((data) && (data._id)) {
                        item._id = data._id;
                        if (!resultData[data._id]) {
                            let dataItem = serializeObj(data);
                            delete dataItem['display'];
                            resultData[data._id] = dataItem;
                        }
                    }
                };

                if (display.items) {
                    _.forEach(display.items, function (item) {
                        addItem(item, owner, 'items')
                    });
                }
                else
                    addItem(display, owner)
            }
        };

        let filter = {};
        let filterParams;
        if (req.params.filter) {
            filterParams = querystring.parse(req.params.filter);
            _.forEach(filterParams, function(value, key){
                if (_.isArray(value))
                    filter[key] = {"$in": value};
                else
                    filter[key] = value;
            });

        }

        console.log('get display', filterParams, filter);


        let displays = await ctrl.__db.collection('display').find(filter).sort({"zorder": 1}).toArray();
        _.forEach(displays, function (display) {
            let data = null;
            if (display.data)
                if (display.data.sensor)
                    data = self.__controller.sensors[display.data.sensor];

            addDisplay(display, data);
        });

        let nodes = await ctrl.__db.collection('node').find({"display":{$exists: true}}).sort({"display.zorder": 1}).toArray();
        _.forEach(nodes, function (node) {
            addDisplay(node.display, node);
        });

        let sensors = await ctrl.__db.collection('sensor').find({"display":{$exists: true}}).sort({"display.zorder": 1}).toArray();
        _.forEach(sensors, function (sensor) {
            addDisplay(sensor.display, sensor);
        });

        res.render(appRoot + '/html/display.html', {display: resultDisplay, data: resultData});
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

      ctrl.on('updateSensor', function (sensor) {
          io.emit('updateSensor', serializeObj(sensor));
      });


    });

    app.get('/api/query/:question', function (request, response){
      //var utf8 = require('utf8');
      //var question = utf8.decode(request.params.question);
      var question = request.params.question;
      console.log('query question',  question.yellow.green);
      question = _.lowerCase(_.deburr( question ));
      console.log('searching for', question.bold.green);
      var found = _.find(self.allInteraction, {question: question});
      if (found) {
        var val = found.obj.lastValue.toString().replace('.', ' point ');

        if (found.answerAction)
          found.obj.__ownerNode.__ownerDevice.send(found.obj.__ownerNode, found.obj, 2, found.answerAction);
        if (found.answer)
            response.status(200).send(found.answer.replace('{value}', val ));

        if (found.answerEval)
            response.status(200).send(eval(found.answerEval.replace('{value}', val)));

      } else
          response.status(412).send('interaction non trouvé');
    });

    app.get('/api/nodes', function (request, response){
      let result = [];

      if  (request.params.filter)
        result = _.filter(ctrl.nodes, request.params.filter);

      _.forEach(ctrl.nodes, function(node){
        let resultNode = serializeObj(node);
        if (request.query.includeSensors) {
            let sensors = [];
            _.forEach(node.__sensors, function (sensor) {
                  sensors.push(serializeObj(sensor))
                }
            );
            resultNode.sensors = sensors;
        }
        result.push(resultNode);
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
        let node = ctrl.nodes[request.params._nodeId];
        let result = serializeObj(node);
        if (request.query.includeSensors) {
            let sensors = [];
            _.forEach(node.__sensors, function (sensor) {
                    sensors.push(serializeObj(sensor))
                }
            );
            result.sensors = sensors;
        }
        response.json(result);
    });

    app.get('/api/node/:_nodeId/reboot', function (request, response){
      let node = ctrl.nodes[request.params._nodeId];
      if (node) {
        node.__ownerDevice.reboot(node, false);
        response.status(200).send('Stack reboot node msg to ' + node.name);
      }
      else
        response.status(412).send('node not found');
    });

    app.get('/api/node/:_nodeId/refresh', function (request, response){
        let node = ctrl.nodes[request.params._nodeId];
        if (node) {
            node.refresh();
            response.status(200).send('refresh was called ' + node.name);
        }
        else
            response.status(412).send('node not found');
    });

    app.post('/api/node/:_nodeId', function (request, response){

      var node = ctrl.nodes[request.params._nodeId];
      if (node) {

        checkIntegerProp(request.body);
        console.log(request.body);

        ctrl.updateNode(node, request.body, false);
        response.status(200).send('node updated');
      }
      else
        response.status(412).send('node not found');
    });

    app.delete('/api/node/:_nodeId', function (request, response){
      let node = ctrl.nodes[request.params._nodeId];
      if (node) {

        ctrl.deleteNode(node);
        response.status(200).send('node deleted');
      }
      else
        response.status(412).send('node not found');
    });

    app.delete('/api/sensor/:_sensorId', function (request, response){
        let sensor = ctrl.sensors[request.params._sensorId];
        if (sensor) {
            ctrl.deleteSensor(sensor);
            response.status(200).send('sensor deleted');
        }
        else
            response.status(412).send('sensor not found');
    });


    app.get('/api/sensors/query/:filter', function (request, response){
        console.log('searching for', request.params.filter.bold.green);
        let result = [];
        _.forEach(_.filter(ctrl.sensors, JSON.parse(request.params.filter)), function(sensor){
            result.push(serializeObj(sensor));
        });
        response.json(result);
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
        //sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, request.params._msgType, request.body.value);
        //sensor.__ownerNode.__ownerDevice.send(sensor.__ownerNode, sensor, request.params._msgType, request.body.value);

        response.status(200).send('send message to node ' + sensor.__ownerNode.name+ ', msgType: ' + request.params._msgType + ', msgVal: ' + request.body.value);
      }
      else
        response.status(412).send('sensor not found');
    });

    app.put('/api/sensor/function/:_sensorId/:_functionName', function (request, response){
          var sensor = ctrl.sensors[request.params._sensorId];
          if (sensor) {
              console.log('call sensor function', request.params._functionName, request.body);
              sensor[request.params._functionName](request.body.value);
              response.status(200).send('call sensor function ' + request.params._functionName);
          }
          else
              response.status(412).send('sensor not found');
      });

    app.post('/api/sensor/:_sensorId', function (request, response){
      console.log(request.body);
      var sensor = ctrl.sensors[request.params._sensorId];
      if (sensor) {
        checkIntegerProp(request.body);
        ctrl.updateSensor(sensor, request.body, false);
        response.status(200).send('sensor updated');
      }
      else
        response.status(412).send('sensor not found');
    });

    app.post('/api/invokeAction/:_actionName/:_methodName', function (request, response){
        console.log('invokeAction', request.params._actionName, request.params._methodName,  request.body);
       ctrl.invokeAction(request.params._actionName, request.params._methodName,  [request.body]);
       response.status(200).send('action called');
    });

    app.post('/api/runScript', function (request, response){
        console.log('run script', request.body.script);
        ctrl.runScript(request.body.script, {});
        response.status(200).send('script called');
    });


    app.get('/api/file/:fileId', function(req, res) {
        ctrl.getFileAttachement(req.params.fileId, function(result){
            res.json(result);
        });
    });

    app.post('/api/upload', function(req, res) {
        if (!req.files)
            return res.status(400).send('No files were uploaded.');

          //console.log(req.files);
          //console.log(req.body);

          _.forEach(req.files, function(file){
              ctrl.addFileAttachement(file.data, function(result){
                  console.log('addFileAttachement', req.body.id);
                  let sensor = ctrl.sensors[req.body.id];
                  ctrl.updateSensor(sensor, {fileData: {name: file.name,  mimetype: file.mimetype, fileId: result.ops[0]._id}}, false);
                  console.log(result.ops[0]._id);
                  res.json({fileId: result.ops[0]._id});
              });
          });


          /* The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
          let sampleFile = req.files.sampleFile;

          // Use the mv() method to place the file somewhere on your server
          console.log(sampleFile);
          sampleFile.mv('/tmp/file.jpg', function(err) {
              if (err)
                  return res.status(500).send(err);

              res.send('File uploaded!');
          });

          */
      });


    app.get('/api/sensor/:_sensorId/values', function (request, response){
      var sensor = ctrl.sensors[request.params._sensorId];
      response.json(serializeObj(sensor.__values));
    });

    app.get('/api/sensor/:_sensorId/dbvalues', function (request, response){
       let sensor = ctrl.sensors[request.params._sensorId];
       let where = {
            selector: {
                sensorId: sensor._id,
                valueDate: {}
            }
            //sort: ['valueDate']
        };

        if (request.query.minValueDate)
            where.selector.valueDate.$gte = _.parseInt(request.query.minValueDate);

        if (request.query.maxValueDate)
            where.selector.valueDate.$lte = _.parseInt(request.query.maxValueDate);

        console.log(where);

        ctrl.__db.collection('sensorsValues').find(where.selector).toArray( function (err, docs) {
            assert.equal(err, null);
            response.json(serializeObj(docs));
        });

      /*var sensorsVal = ctrl.__db.sensorsVal.find(where).sort({ valueDate: 1 }).limit(request.query.limit || 9999999999);
      sensorsVal.exec().then(function(vals) {
        response.json(serializeObj(vals));
      });*/
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



