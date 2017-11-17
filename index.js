/**
 * Created by chune on 2016-10-21.
 */

process.chdir(__dirname);

const config = require('./config');
var server = require('./server'),
    logger = require('./logger');

logger.addLogger('core', {fileName: config.logger.core, level: config.logger.level});

logger['core'].info("Starting myHomeSim Server");
server.start(logger, config);
