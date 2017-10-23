
const _ = require('lodash');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var appRoot = require('app-root-path');

var server = require('http').Server(app);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.engine('js', require('ejs').renderFile);

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

app.put('/api/sensor/:_sensorId/:_msgType', function (request, response){
    console.log('send message to node', request.body);
    response.status(200).send('send message to node  msgType: ' + request.params._msgType + ', msgVal: ' + request.body.value);
});


server.listen(8081, function(){
    console.log("Server listening on: http://localhost:%s", 8081);
});

