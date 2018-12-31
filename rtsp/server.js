// server.js

const express    = require('express');        // call express
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const moment     = require('moment');
const RTSP       = require('node-rtsp-recorder');
const _          = require('lodash');
const disk       = require('diskusage');
const debug      = require('debug')('rtsp:server');



let myWizeCams = [];


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let port = process.env.PORT || 8082;        // set our port

// ROUTES FOR OUR API
// =============================================================================
let router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here

router.route('/startRecorder')
    .get(function(req, res) {
        let myWizeCam =  _.find(myWizeCams, {id: 'myWizeCam1'});
        if (!myWizeCam) {
            myWizeCam = new RTSP.Recorder({
                url: 'rtsp://192.168.0.159:8554/unicast',
                timeLimit: 60 * 5, // time in seconds for each segmented video file
                folder: '/mnt/',
                directoryPathFormat: 'YYYYMMDD',
                fileNameFormat: 'HH-mm-ss',
                name: 'myWizeCam1'
            });
            myWizeCam = {id: 'myWizeCam1', startTime: moment(), endTime: moment().add(1, 'minutes'), rtsp: myWizeCam};
            myWizeCams.push(myWizeCam);
            myWizeCam.rtsp.startRecording();
            debug('new recorder started!', 'endRecordTime', myWizeCam.endTime.format('HH:mm:ss'));
            res.json({ message: 'new recorder started!', endRecordTime: myWizeCam.endTime.format('HH:mm:ss') });
        } else {
           myWizeCam.endTime = moment().add(1, 'minutes');
           debug('extend recorder end time!', 'endRecordTime', myWizeCam.endTime.format('HH:mm:ss'));
           res.json({ message: 'extend recorder end time!', endRecordTime: myWizeCam.endTime.format('HH:mm:ss') });
        }

    });

router.route('/stopRecorder')
    .get(function(req, res) {
        let myWizeCam =  _.find(myWizeCams, {id: 'myWizeCam1'});
        if (!myWizeCam) {
            debug('/stopRecorder', 'no recorder found!');
            res.json({ error: 'no recorder found!' });
        } else {
            myWizeCam.endTime = moment();
            debug('/stopRecorder', 'recorder will be stop soon!');
            res.json({ message: 'recorder will be stop soon!' });
        }
    });

router.route('/sizeMedia')
    .get(function(req, res) {
        disk.check('/mnt/', function(err, info) {
            if (err) {
                res.json({ error: err });
                debug('/sizeMedia', 'error', err);
                return true;
            } else {
                res.json({availableG: (info.available/ 1024 / 1024 / 1024).toFixed(2), freeG: (info.free/ 1024 / 1024 / 1024).toFixed(2), totalG: (info.total/ 1024 / 1024 / 1024).toFixed(2) });
            }
        });
    });

setInterval(() => {
    _.forEachRight(myWizeCams, function(myWizeCam, index) {
        debug('setInterval', myWizeCam.startTime.format('HH:mm:ss'), myWizeCam.endTime.format('HH:mm:ss'), index);
        if (myWizeCam && moment() >= myWizeCam.endTime) {
          myWizeCam.rtsp.stopRecording();
          myWizeCams.splice(index, 1);
        }
    });

}, 15000);


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
debug('RTSP Server Started at port: ' + port);
