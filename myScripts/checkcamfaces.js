// import entire SDK
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

const fs = require('fs');
const _ = require('lodash');
const sharp = require('sharp');
const request = require('request').defaults({ rejectUnauthorized: false });
const colors = require('colors');

let rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

function base64Encode(file) {
    var data = fs.readFileSync(file);
    return new Buffer.from(data, 'base64')
}

function compareFaces() {

    let params = {
        SourceImage: {
            Bytes: base64Encode('/tmp/img/lauralie1.jpg')
        },
        TargetImage: {
            Bytes: base64Encode('/tmp/img/lauralie2.jpg')
        },
        SimilarityThreshold: 0.0
    };


    rekognition.compareFaces(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });

}

function createCollection() {
    let params = {
        CollectionId: "lauraliePhotos"
    };

    rekognition.createCollection(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });

}

function indexFace(imgFile, imgId) {

    var params = {
        CollectionId: 'lauraliePhotos',
        Image: {
            Bytes: base64Encode(imgFile)
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

function listFaces() {

    var params = {
        CollectionId: 'lauraliePhotos',
        MaxResults: 20
    };
    rekognition.listFaces(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);
    });

}

function searchFacesByImage(imgFile) {

    console.time(imgFile);

    var params = {
        CollectionId: 'lauraliePhotos',
        Image: {
            Bytes: base64Encode(imgFile)
        },
        FaceMatchThreshold: 0.0,
        MaxFaces: 1
    };


    rekognition.searchFacesByImage(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        //else     console.log(data);           // successful response
        else
            _.forEach(data.FaceMatches, function(face) {
                console.timeEnd(imgFile);
                console.log(face.Similarity, face.Face);

            });

    });

}

function searchFacesByImageData(imgData, cb) {
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

function cropImageFace(imgData, boundingBox, cb, imgFileName) {
    console.time('CropFace'+imgFileName);
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
                    console.timeEnd('CropFace'+imgFileName);
                    if (err) console.log('cropImageFace toBuffer error' , err);
                    else
                        cb(null, imgData);
                })
                .toFile('/tmp/img/face/'+imgFileName+'.jpg' , (err, info) => { if (err) console.log('cropImageFace toFile error' , err); });
        });
}

function detectFaces(imgFile, imgName, cb) {
    console.time('detectFaces-'+imgName);
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
                            cb('no detected face', null, null, imgName, true);
                        else
                        if (data.FaceDetails.length == 1) {
                            console.log('no crop needed');
                            //console.time('resizeTime');
                            sharpImg.resize(null, 480).toBuffer((err, imgDataResize, info) => {
                                //console.timeEnd('resizeTime');
                                searchFacesByImageData(imgDataResize, function(err, similarity, face){
                                    cb(err, similarity, face, imgName, true);
                                    console.timeEnd('detectFaces-'+imgName);
                                });
                            });
                        } else
                            _.forEach(data.FaceDetails, function(face, index) {
                                cropImageFace(imgData, face.BoundingBox,  function(err, faceImage){
                                    searchFacesByImageData(faceImage, function(err, similarity, face){
                                        let last = (index == data.FaceDetails.length-1);
                                        cb(err, similarity, face, imgName+'-'+index, last);
                                        if (last)
                                            console.timeEnd('detectFaces-'+imgName);
                                    });
                                }, imgName+'-'+index);
                            });
                    }
                });
            }
        });
    //.toFile('/tmp/img/face/resizeorig.jpg' , (err, info) => { if (err) console.log('detectFaces toFile error' , err); });
}

//indexFace('/tmp/img/alexandra1.jpg', 'alexandraId');
//searchFacesByImage('/tmp/img/cahrlineelianelauralie.jpg');


function checkFacesFromCam(callback, maxCountGetPhoto = 3){
    console.time('checkFacesFromCam');

    function getCamPic(cb) {
        console.time('getCamPic');
        request({url: 'https://root:Hintendo45@192.168.2.96/cgi-bin/currentpic.cgi', encoding: null, method: 'GET'},
            function (error, response, body) {
                console.timeEnd('getCamPic');
                cb(error, response, body);
            }
        );
    }
    let getCountPhoto = 0;
    let getCountDetectFaces = 0;

    function checkCamPic() {
        getCamPic((err, resp, data) => {
            fs.writeFileSync('/tmp/img/face/camPicOrig' + getCountPhoto + '.jpg', data,  'binary');
            detectFaces(data, 'camPicOrig' + getCountPhoto, (err, similarity, face, index, last) => {
                if (err) {
                    if (err.message != 'There are no faces in the image. Should be at least 1.')
                        callback(err);
                    else
                        callback('no face detected');
                }
                else
                    callback(null, similarity, face);

                if (last) {
                    getCountDetectFaces+=1;
                    if (getCountDetectFaces >= maxCountGetPhoto)
                        setTimeout(()=>{
                            callback(null, null, null, true);
                            console.timeEnd('checkFacesFromCam');
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

if ((value == "ON") && (server.vars['checkFacesFromCamRunnig'] != true)) {
    console.log('!!!!!!!!!!!!? checkFacesFromCamRunnig'.red);

    server.vars['checkFacesFromCamRunnig'] = true;
    let whoAtHome = {};
    checkFacesFromCam((err, similarity, face, finish = false) => {
        if (err) console.log(err);
        else {
            if (similarity != null && face != null) {
                console.log('!!!!!!!!???????????', (Math.trunc(similarity) + '%').yellow, face.ExternalImageId.green);
                if (!whoAtHome[face.ExternalImageId] || whoAtHome[face.ExternalImageId] < similarity)
                    whoAtHome[face.ExternalImageId] = similarity;
            }
        }

        if (finish) {
          console.log('??!!!!!!!!!!!?? checkFacesFromCamRunnig END'.red);
          console.log(whoAtHome);
          server.vars['checkFacesFromCamRunnig'] = false;
        }
    });

}

//searchFacesByImage('/tmp/img/face/camPicOrig2.jpg');
//searchFacesByImage('/tmp/img/face/camPicOrig0-0.jpg');


/*
detectFaces('/tmp/img/face/camPicOrig0.jpg', 'test',  function(err, similarity, face, index) {
	if (err) {
	   if (err.message != 'There are no faces in the image. Should be at least 1.')
         console.log('detectFaces Error' , err);
	   else
		 console.log('no face detected');
	}
	else
	  console.log(similarity, face.ExternalImageId, index);
});
*/



