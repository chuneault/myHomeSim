/**
 * Created by chune on 2016-10-21.
 */

module.exports = {
  secret: 'ilovescotchyscotch',
  db: {master: 'http://192.168.0.150:5984/myHomeSim', sensorsValues: 'http://192.168.0.150:5984/sensorsValues'},
  cryptoOptions: {iterations: 256, keylen: 512},
  logger: {
    core: './logs/cor.log',
    level: 'debug'
  }
};

