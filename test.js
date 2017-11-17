
const _ = require('lodash');


var nodes = [];


nodes.push({deviceId: 1, vendor:{id:1, name: "allo"}});
nodes.push({deviceId: 1, vendor:{id:2, name: "bonjour"}});


var found = _.find(nodes, {deviceId: 1, vendor: {id:3}});

console.log(found);