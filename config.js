/**
 * Created by chune on 2016-10-21.
 */

module.exports = {
  secret: 'ilovescotchyscotch',
  db: {url: 'mongodb://127.0.0.1:27017', dbName: 'myhomesim'},
  cryptoOptions: {iterations: 256, keylen: 512},
  logger: {
    core: './logs/cor.log',
    level: 'debug'
  }
};

