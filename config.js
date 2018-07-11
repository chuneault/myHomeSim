/**
 * Created by chune on 2016-10-21.
 */

module.exports = {
  secret: 'ilovescotchyscotch',
  db: {url: 'mongodb://192.168.0.168:27017', dbName: 'myhomesim'},
  cryptoOptions: {iterations: 256, keylen: 512},
  logger: {
    core: './logs/cor.log',
    level: 'debug'
  }
};

