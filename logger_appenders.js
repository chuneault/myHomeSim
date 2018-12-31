'use strict';

const CircularBuffer = require('mnemonist/circular-buffer');
let buffer;

function bufferAppender(layout, timezoneOffset) {
    return (loggingEvent) => {
       console.log(layout(loggingEvent, timezoneOffset));
       buffer.push(layout(loggingEvent, timezoneOffset));
    };
}

function configure(config, layouts) {

    buffer = new CircularBuffer(Array, config.size || 100);

    let layout = layouts.colouredLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }
    return bufferAppender(layout, config.timezoneOffset);
}

module.exports.configure = configure;
