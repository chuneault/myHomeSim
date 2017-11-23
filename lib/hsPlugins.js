"use strict";

const _ = require('lodash');

class hsPlugIns  {

  constructor(controller, params) {
    this.__controller = controller;
    _.extend(this, params);

    /*const events = require('events');
    this.event = new events;*/
  };

  ready() {
      this.__controller.vars['ready'][params.name] = true;
  }

}

module.exports = hsPlugIns;
