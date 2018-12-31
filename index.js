/**
 * Created by chune on 2016-10-21.
 */

process.chdir(__dirname);

const config = require('./config');
let server = require('./server'),
    logger = require('./logger');

let log =logger.addLogger('core', {fileName: config.logger.core, level: config.logger.level});

log.info("Starting myHomeSim Server");
server.start(logger, config);
