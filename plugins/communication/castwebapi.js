/**
 * Created by chune on 2016-10-22.
 */
"use strict";


const unirest = require('unirest');
const _ = require('lodash');
const plugins = require("../../lib/hsPlugins.js");

class castwebapi extends plugins {


    dingDong(options) {
      console.log('dingDong call');
      unirest.post('http://127.0.0.1:3000/device/7a070e7e-5be0-441f-8990-2d6b9ffcc02c/playMedia')
        .send({format: 'json',
            mediaTitle: 'Bell Front Door',
            mediaSubtitle: 'Ding Dong',
            mediaType: 'audio/mp3',
            mediaUrl: 'http://techreviewsandhelp.com/wp-content/uploads/2018/06/Someone-is-at-the-front-door-1.mp3',
            mediaStreamType: 'NONE'
        })
        .end(function (response) {
          if (response.ok)
            console.log(response.body);
        });
    }

    constructor(controller, params) {
      super(controller, params);
      controller.addObject('castwebapi', {class: this, dingDong: this.dingDong});
    }
}

exports.connect = function (pluginType, params, callback) {
  callback({
    name: 'castwebapi',
    params: params,
    pluginClass: castwebapi
  });
};

