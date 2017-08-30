/**
 * Created by chune on 2016-10-21.
 */

module.exports = {
  secret: 'ilovescotchyscotch',
  db: {mongodb: 'mongodb://127.0.0.1:27017/sscrestrh'},
  cryptoOptions: {iterations: 256, keylen: 512},
  logger: {
    core: './logs/cor.log',
    level: 'debug'
  }
};

