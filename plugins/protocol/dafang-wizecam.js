"use strict";

const plugins = require("../../lib/hsPlugins.js");

// import entire SDK
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

const fs = require('fs');
const _ = require('lodash');
const sharp = require('sharp');
const request = require('request').defaults({ rejectUnauthorized: false });
const colors = require('colors');
const moment = require('moment');

const savePath = '/mnt/faces/';

let rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});


class wizecam extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;
        self.log = params.logger.addLogger('wizecam', {fileName: './logs/wizecam.log'});

        controller.addDevice(this);

        self.clients = {};
        self.lastcheckFacesFromCam = moment();
        self.whoAtHome = {};

        controller.addObject('wizecam', {class: this, checkFacesFromCam: self.checkFacesFromCam, startRecord: self.startRecord, sayHelloAtHome: self.sayHelloAtHome});

        controller.on('loadDBCompleted', function () {

            controller.on('mqtt-newclient', function(client){
                if (_.startsWith(client.id, 'mosqpub|')) {
                    //self.clients[client.id] = client;
                    //self.log.info('New WizeCam Client', client.id);
                }

            });

            controller.on('mqtt-published', function(packet, client){

                if (client && client.id && (_.startsWith(client.id, 'mosqpub|'))) {

                    if (_.startsWith(packet.topic, 'myhome/myWizeCam')) {

                        let topics = packet.topic.split('/');

                        if ((topics.length == 2) && (_.startsWith(packet.payload.toString(), '{'))) {
                            self.updateWizeCamStatus(topics, packet.payload.toString());
                        }
                        else
                        if (topics.length == 3) {
                            //myhome/myWizeCam1/motion ON
                            self.updateWizeCamSensors( topics, packet.payload.toString());

                        }
                    }
                }
            });
        });
    };

    createDirIfNotExists(folderPath) {
        try {
            if (!fs.lstatSync(folderPath).isDirectory()) {
                fs.mkdirSync(folderPath)
            }
        } catch (e) {
            fs.mkdirSync(folderPath)
        }
    }


    startRecord (fromSensor) {
        let self = this;
        self.checkFacesFromCam();
        request({url: 'http://'+self.params.ipRTSP+'/api/startRecorder', encoding: null, method: 'GET'},
            function (error, response, body) {
               self.log.debug(body);
            }
        );
    }

    //Published myhome/myWizeCam1 {"uptime":" 02:34:32 up 49 min,  0 users,  load average: 2.76, 2.82, 2.71",  "ssid":"chalwifi", "bitrate":"72.2 Mb/s", "signal_level":"88%", "link_quality":"81%", "noise_level":"0%" }
    updateWizeCamStatus(topics, payload) {
        let self = this;
        let jsonPayload = JSON.parse(payload);

        self.__controller.addOrUpdateNode({id: topics[1]},
            {id: topics[1], name: topics[1], vendor: jsonPayload}, self,
            function (error, node) {
                self.clients[topics[1]] ={"node": node };
            }
        );
    }

    //myhome/myWizeCam1/motion ON
    updateWizeCamSensors(topics, payLoad) {
        let self = this;
        if (self.clients[topics[1]]) {
            let ownerNode = self.clients[topics[1]].node;
            self.__controller.addOrUpdateSensor({nodeId: ownerNode._id, name: topics[2]}, {
                    name: topics[2] /*, functionType: [self.__controller.sensorFunctionType.switch],
                    stateOn: jsonPayload.POWER == 'ON'*/}, ownerNode,
                function (err, sensor) {
                   self.__controller.addSensorValue(sensor, payLoad);
                });
        }
    }

    write(sensor, cmd, cmdVal) {
        this.__controller.mqttBroker.server.publish({
            topic: 'cmnd/'+sensor.__ownerNode.name+'/'+cmd,
            payload: cmdVal, // or a Buffer
            qos: 0, // 0, 1, or 2
            retain: false // or true
        });
    }


    base64Encode(file) {
        return new Buffer.from(fs.readFileSync(file), 'base64')
    }

    compareFaces() {

        let params = {
            SourceImage: {
                Bytes: this.base64Encode(savePath+'lauralie1.jpg')
            },
            TargetImage: {
                Bytes: this.base64Encode(savePath+'lauralie2.jpg')
            },
            SimilarityThreshold: 0.0
        };


        rekognition.compareFaces(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });

    }

    createCollection() {
        let params = {
            CollectionId: "lauraliePhotos"
        };

        rekognition.createCollection(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });

    }

    indexFace(imgFile, imgId) {

        var params = {
            CollectionId: 'lauraliePhotos',
            Image: {
                Bytes: this.base64Encode(imgFile)
            },
            DetectionAttributes: [
                'DEFAULT'

            ],
            ExternalImageId: imgId,
            MaxFaces: 1,
            QualityFilter: 'AUTO'
        };

        rekognition.indexFaces(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });
    }

    listFaces() {

        var params = {
            CollectionId: 'lauraliePhotos',
            MaxResults: 20
        };
        rekognition.listFaces(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);
        });

    }

    searchFacesByImage(imgFile) {

        let self = this;
        self.log.profileTime(imgFile);

        var params = {
            CollectionId: 'lauraliePhotos',
            Image: {
                Bytes: this.base64Encode(imgFile)
            },
            FaceMatchThreshold: 0.0,
            MaxFaces: 1
        };


        rekognition.searchFacesByImage(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            //else     console.log(data);           // successful response
            else
                _.forEach(data.FaceMatches, function(face) {
                    self.log.profileEnd(imgFile);
                    //console.log(face.Similarity, face.Face);
                });

        });

    }

    searchFacesByImageData(imgData, cb) {
        let params = {
            CollectionId: 'lauraliePhotos',
            Image: {
                Bytes: new Buffer.from(imgData, 'base64')
            },
            FaceMatchThreshold: 0,
            MaxFaces: 1
        };

        rekognition.searchFacesByImage(params, function(err, data) {
            if (err) {
                if (cb) cb(err);
                //console.log('searchFacesByImageData err', err); // an error occurred
            }
            else
                _.forEach(data.FaceMatches, function(face) {
                    if (cb) cb(null, face.Similarity, face.Face);
                });
        });
    }

    cropImageFace(imgData, boundingBox, cb, imgFileName) {
        let self = this;
        self.log.profileTime('CropFace'+imgFileName);
        let image = sharp(imgData);
        let offSetX = 50;
        let offSetY = 75;
        image
            .metadata((err, metadata) => {
                image
                    .extract({ left: Math.max(0,Math.trunc(boundingBox.Left * metadata.width) - offSetX),
                        top: Math.max(0,Math.trunc(boundingBox.Top * metadata.height) - offSetX),
                        width: Math.trunc(boundingBox.Width * metadata.width) + offSetY,
                        height: Math.trunc(boundingBox.Height * metadata.height) + offSetY })
                    //.resize(null,250)
                    .jpeg({quality: 90})
                    .toBuffer((err, imgData, info) => {
                        self.log.profileEnd('CropFace'+imgFileName);
                        if (err) { console.log('cropImageFace toBuffer error' , err); cb(err) }
                        else
                            cb(null, imgData);
                    })
                    //.toFile(savePath+'face/'+imgFileName+'.jpg' , (err, info) => { if (err) console.log('cropImageFace toFile error' , err); });
            });
    }

    detectFaces(imgFile, imgName, cb) {
        let self = this;
        self.log.profileTime('detectFaces-'+imgName);
        let sharpImg = sharp(imgFile);
        sharpImg
            .toBuffer((err, imgData, info) => {
                if (err) console.log('detectFaces toBuffer error' , err);
                else {
                    let params = { Image: { Bytes: new Buffer.from(imgData, 'base64')},
                        Attributes: ['DEFAULT' //| ALL
                        ]
                    };

                    rekognition.detectFaces(params, function(err, data) {
                        if (err) cb(err, null, null, imgName, true);
                        else {
                            if (data.FaceDetails.length == 0)
                                cb('no recognize any face', null, null, imgName, true, imgData);
                            else
                            if (data.FaceDetails.length == 1) {
                                //console.log('no crop needed');
                                //console.time('resizeTime');
                                sharpImg.resize(null, 480).toBuffer((err, imgDataResize, info) => {
                                    //console.timeEnd('resizeTime');
                                    self.searchFacesByImageData(imgDataResize, function(err, similarity, face){
                                        self.log.profileEnd('detectFaces-'+imgName);
                                        self.cropImageFace(imgData, data.FaceDetails[0].BoundingBox, (error, faceImage) => {
                                            cb(err, similarity, face, imgName, true, faceImage);
                                        }, imgName+'-0');
                                    });
                                });
                            } else
                                _.forEach(data.FaceDetails, function(face, index) {
                                    self.cropImageFace(imgData, face.BoundingBox,  function(err, faceImage){
                                        if (err) cb(err);
                                        else
                                          self.searchFacesByImageData(faceImage, function(err, similarity, face){
                                            let last = (index == data.FaceDetails.length-1);
                                            cb(err, similarity, face, imgName+'-'+index, last, faceImage);
                                            if (last)
                                                self.log.profileEnd('detectFaces-'+imgName);
                                          });
                                    }, imgName+'-'+index);
                                });
                        }
                    });
                }
            });
        //.toFile(savePath+'face/resizeorig.jpg' , (err, info) => { if (err) console.log('detectFaces toFile error' , err); });
    }

    getFacesFromCam(callback, maxCountGetPhoto = 4){
        let self = this;
        self.log.profileTime('getFacesFromCam');

        function getCamPic(cb) {
            self.log.profileTime('getCamPic');
            request({url: 'https://'+self.params.userName+':'+self.params.password+'@'+self.params.ip+'/cgi-bin/currentpic.cgi', encoding: null, method: 'GET'},
                function (error, response, body) {
                    self.log.profileEnd('getCamPic');
                    cb(error, response, body);
                }
            );
        }
        let getCountPhoto = 0;
        let getCountDetectFaces = 0;

        function checkCamPic() {
            getCamPic((err, resp, data) => {
                let faceSaveFileName = moment().format('YYYY-MM-DD_HH.mm.ss.SSS') + '-face.jpg';
                let savePathFace = savePath + moment().format('YYYYMMDD') + '/';
                self.createDirIfNotExists(savePathFace);
                fs.writeFile(savePathFace+faceSaveFileName, data,  'binary',
                 (err) => {
                  if (err)
                    self.log.error('writeFile Error', err);
                });

                self.detectFaces(data, 'camPicOrig' + getCountPhoto, (err, similarity, face, index, last, imgFace) => {
                    if (err) {
                        if (err.message != 'There are no faces in the image. Should be at least 1.')
                          callback(err, null, null, last, imgFace, faceSaveFileName);
                        else
                          callback('no detected face in image', null, null, last, imgFace, faceSaveFileName);
                    }
                    else
                        callback(null, similarity, face, last, imgFace, faceSaveFileName);

                    if (last) {
                        getCountDetectFaces+=1;
                        if (getCountDetectFaces >= maxCountGetPhoto)
                            setTimeout(()=>{
                                //callback(null, null, null, true);
                                self.log.profileEnd('getFacesFromCam');
                            }, 5);
                    }
                });
                getCountPhoto+=1;
                if (getCountPhoto < maxCountGetPhoto)
                    checkCamPic();
            });
        }
        checkCamPic();
    }


    sayHelloAtHome() {
        let self = this;
        let whoAtHome = self.whoAtHome;
        let names = '';
        if (whoAtHome) {
            _.forEach(whoAtHome, (face, nameId) => {
                if ((face.similarity > 25) && (moment(face.lastView).diff(moment(), 'seconds') >= -60) && (face.sayHello == false)) {
                    face.sayHello = true;
                    let name = _.upperFirst(nameId.substr(0, nameId.length - 2));
                    names += name + ', ';
                }
            });
            names = names.substr(0, names.length - 2);
            if (names != '') {
                self.__controller.plugins['castwebapi'].TTS('diner', 'Bonjour ' + names, 100);
            }
        }
    }

    checkFacesFromCam(fromSensor) {
        let self = this;
        if (moment() - self.lastcheckFacesFromCam >= 1500 )   {
            self.lastcheckFacesFromCam = moment();
            self.getFacesFromCam((err, similarity, face, finish = false, imgFace, faceSaveFileName) => {
              if (err) {
                  if ((err != 'no recognize any face') && (err != 'no detected face in image'))
                    self.log.error(err, faceSaveFileName);
                  if (imgFace) {
                      self.log.info(err, faceSaveFileName);
                      self.__controller.plugins['httpServer'].io.emit('noFaceDetected',
                          {img64: new Buffer.from(imgFace).toString('base64')});
                  }
              }
              else {
                if (similarity != null && face != null) {
                  self.log.info('Found at ' + Math.trunc(similarity) + '%', face.ExternalImageId, faceSaveFileName);
                  if (!self.whoAtHome[face.ExternalImageId] || self.whoAtHome[face.ExternalImageId].similarity < similarity) {
                      self.whoAtHome[face.ExternalImageId] = {similarity: similarity, imgFace: imgFace, lastView: moment(), sayHello: false};
                  }
                }
              }

              if (finish) {
                  let names = '';
                  _.forEach(self.whoAtHome, (face, nameId) => {
                      self.__controller.plugins['httpServer'].io.emit('newFaceDetected',
                            {nameId: nameId, similarity: face.similarity, img64: new Buffer.from(face.imgFace).toString('base64') });
                      if ((face.similarity > 20) && (moment(face.lastView).diff(moment(), 'seconds') >= -60 )) {
                          let name = _.upperFirst(nameId.substr(0, nameId.length - 2));
                          self.log.info('New Face Detected', name);
                          names += name + ', ';
                      }
                  });
                  names = names.substr(0, names.length - 2);
                  if (names != '') {
                      self.__controller.invokeAction('kik', 'sendMessage', ['personnes détectées ' + names, 'carlturtle37']);
                  }
              }
            });

        }
    }

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'wizecam',
        params: params,
        pluginClass: wizecam
    });
};


