"use strict";

/**
 * Created by chune on 2016-10-17.
 */

const _ = require('lodash');
const plugins = require("../../lib/hsPlugins.js");

class scripts extends plugins {


  constructor(controller, params) {

    super(controller, params);

    var self = this;

    self.params.forEach(function(script){
      if (script.script)
        self.__controller.addVar(script.name, {__type: 'script', script: script.script});
      else
      if (script.scriptFileName)
        self.__controller.addVar(script.name, {__type: 'script', scriptFileName: script.scriptFileName});

      if (script.runAtLoad)
          self.__controller.runScript(script.name);


    });

    self.__controller.addObject('web', {class: self, httpGet: self.httpGet});

  }

  httpGet(url){
    const http = require('http');

    http.get(url, (res) => {
      // consume response body
      res.resume();
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });
  }
}

exports.connect = function(pluginType, params, callback) {
  callback({
    name: 'scripts',
    params: params,
    pluginClass: scripts
  });
};


