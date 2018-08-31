/**
 * Created by chune on 2016-10-22.
 */
"use strict";


const unirest = require('unirest');
const _ = require('lodash');

var plugins = require("../../lib/hsPlugins.js");

class newtifry extends plugins {



  sendMessage(title, body, priority) {
    let self = this;

    if (_.isObject(title)) {
        body = title.body;
        title = title.title;
    }

    unirest.post('https://newtifry.appspot.com/newtifry')
        .send({format: 'json',
          source: self.params.sourceId,
          title: title,
          message: body,
          priority: priority || 1
        })
        .end(function (response) {
          if (response.ok)
            console.log(response.body);
        });
  }

  constructor(controller, params) {
    super(controller, params);
    controller.addObject('newtifry', {class: this, sendMessage: this.sendMessage});
  }

}

exports.connect = function (pluginType, params, callback) {
  callback({
    name: 'newtifry',
    params: params,
    pluginClass: newtifry
  });
};

