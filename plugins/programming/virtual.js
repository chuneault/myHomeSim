/**
 * Created by chune on 2016-10-20.
 */

"use strict";


const _ = require('lodash');
const plugins = require("../../lib/hsPlugins.js");

class virtual extends plugins {

  constructor(controller, params) {

    super(controller, params);

    let self = this;
    let ctrl = self.__controller;

    ctrl.on('loadDBCompleted', function () {
      self.params.forEach(function (virtual) {
        ctrl.addOrGetNode({name: virtual.name}, {name: virtual.name}, null, function (error, node) {
          if (node)
            virtual.infos.forEach(function (info) {
              ctrl.addOrUpdateSensor({_nodeId: node._id, name: info.name}, info, node);
            });
        });
      });

    });

    //self.__controller.addObject('web', {class: self, httpGet: self.httpGet});

  }


}

exports.connect = function (pluginType, params, callback) {
  callback({
    name: 'virtual',
    params: params,
    pluginClass: virtual
  });
};


