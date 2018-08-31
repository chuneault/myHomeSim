/**
 * Created by chune on 2016-10-22.
 */
"use strict";


const unirest = require('unirest');
const _ = require('lodash');
const plugins = require("../../lib/hsPlugins.js");

class castwebapi extends plugins {

    setVolume(deviceName, volume, callBack) {
        let self = this;
        console.log('setVolume call', volume);
        unirest.get('http://'+self.params.url+'/device/'+self.params[deviceName]+'/volume/'+volume)
            .end(function (response) {
                if (response.ok) {
                    console.log(response.body);
                    if (callBack) callBack(response.body);
                }
            });
    }

    getDevice(deviceName, callBack) {
        let self = this;
        console.log('getDevice call');
        unirest.get('http://'+self.params.url+'/device/'+self.params[deviceName])
            .end(function (response) {
                if (response.ok) {
                    console.log(response.body);
                    if (callBack) callBack(response.body);
                }
            });
    }

    TTS(deviceName, message, volume) {
        let self = this;
        console.log('TTS', deviceName, message);

        let playMedia = function(callBack) {
            unirest.post('http://' + self.params.url + '/device/' + self.params[deviceName] + '/playMedia')
                .type('json')
                .send([
                    {
                        mediaTitle: message,
                        googleTTS: 'fr-CA'
                    }
                ])
                .end(function (response) {
                    if (response.ok) {
                        console.log(response.body);
                        if (callBack) callBack(response.body);
                    }

                });
        };

        if (volume){
            self.getDevice(deviceName, function(result){
                let bakVolume = result.status.volume;
                console.log('current volume', bakVolume);
                self.setVolume(deviceName, volume, function(){
                    playMedia(function(){
                        self.setVolume(deviceName, bakVolume);
                    });

                })

            })
        }
        else
            playMedia();

    }

    dingDong(options) {
      let self = this;
      console.log('dingDong call');
      unirest.post('http://'+self.params.url+'/device/7a070e7e-5be0-441f-8990-2d6b9ffcc02c/playMedia')
        .type('json')
        .send([{
            mediaTitle: 'Bell Front Door',
            mediaSubtitle: 'Ding Dong',
            mediaType: 'audio/mp3',
            mediaUrl: 'http://techreviewsandhelp.com/wp-content/uploads/2018/06/Someone-is-at-the-front-door-1.mp3',
            mediaStreamType: 'NONE'
        },
            {
                mediaTitle: 'cours Forest cours',
                googleTTS: 'fr-CA'
            }
        ])
        .end(function (response) {
          if (response.ok)
            console.log(response.body);
        });
    }

    constructor(controller, params) {
      super(controller, params);
      controller.addObject('castwebapi', {class: this, dingDong: this.dingDong, TTS: this.TTS});
    }
}

exports.connect = function (pluginType, params, callback) {
  callback({
    name: 'castwebapi',
    params: params,
    pluginClass: castwebapi
  });
};

