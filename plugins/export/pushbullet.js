"use strict";

/**
 * Created by chune on 2016-10-14.
 */

/**
 * Created by chune on 2016-10-11.
 */

const PushBullet = require('pushbullet');
const _ = require('lodash');
require('colors');

var plugins = require("../../lib/hsPlugins.js");

class pushBullet extends plugins {

  sendMessage(title, body) {

      if (_.isObject(title)) {
          body = title.body;
          title = title.title;
      }

      this.pusher.note(this.deviceSender, title, body.toString(),
        function (error, response) {
          // response is the JSON response from the API
            if (error)
              console.log('PushBullet Error', error);
        });
  }

  sendFile(fileId, title) {
      //pusher.file('u1qSJddxeKwOGuGW', '/path/to/file', 'Important file!', function(error, response) {});
  }

  createStream() {

    var self = this;

    self.stream = self.pusher.stream();
    self.stream.connect();
    self.stream.on('connect', function () {
      //console.log('stream has connected'.bold.green);
    });
    self.stream.on('close', function () {
      //console.log('stream has closed'.bold.green);
    });
    self.stream.on('error', function (error) {
      console.log(error);
    });
    self.stream.on('message', function (message) {
      //console.log(message);
      if ((message.type == 'tickle') && (message.subtype == 'push')) {
        self.checkPushMessage();
      }
    });
    self.stream.on('nop', function () {
      // nop message received
    });
    self.stream.on('tickle', function (type) {});
    self.stream.on('push', function (push) {
      //console.log(push);
    });

    self.checkPushMessage();

  };

  checkPushMessage() {
    var self = this;
    self.pusher.history({limit: 5}, function (error, response) {
      let pushes = _.filter(response.pushes, {
        active: true,
        dismissed: false,
        target_device_iden: self.deviceName.iden
      });
      _.each(pushes, function (push) {
        let argvs = push.body.split(' ');
        if ((argvs.length > 1) && (_.toUpper(argvs[0]) == 'INFO')) {
          let varObj = self.__controller.vars[_.toUpper(argvs[1])];
          if (varObj)
            self.pusher.note(push.source_device_iden, push.body, varObj.toString(false), function (error, response) {
            });
          else
            self.pusher.note(push.source_device_iden, push.body, 'var not found', function (error, response) {
            });
        }

        self.pusher.updatePush(push.iden, {dismissed: true}, function (error, response) {
          //console.log(response);
        });


      });
      //console.log(response);
    });
  }

  constructor(controller, params) {

    super(controller, params);

    var self = this;
    this.pusher = new PushBullet(self.params.apiKey);

    this.pusher.devices(function (error, response) {
      // response is the JSON response from the API
      /*console.log('pushbullet devices msg');
      console.log(error);
      console.log(response);*/
      if (error)
        console.log('PushBullet Error', error);
      else {
      self.deviceSender = _.find(response.devices, {active: true, nickname: self.params.deviceSender}).iden;
      self.deviceName = _.find(response.devices, {active: true, nickname: self.params.deviceName});
      if (!self.deviceName)
        self.pusher.createDevice(self.params.deviceName, function (error, response) {
          console.log(response);
          self.deviceName = response;
          self.createStream();
        });
      else
        self.createStream();
      }

    });


    controller.addObject('pushBullet', {class: self, sendMessage: self.sendMessage, sendFile: self.sendFile});

  }

}

exports.connect = function (pluginType, params, callback) {
  callback({
    name: 'pushBullet',
    params: params,
    pluginClass: pushBullet
  });
};

