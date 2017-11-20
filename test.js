
const _ = require('lodash');


var nodes = [];


nodes.push({deviceId: 2});
nodes.push({deviceId: 1, version: 10, vendor:{id:2, name: "bonjour", version: 10}});


//var node = _.find(nodes, {deviceId: 1, vendor: {id:2}});
var node = _.find(nodes, {deviceId: 1});

console.log('found node', node);

var updatenode = {vendor: {name: 'unknown'}};

/*if (updatenode.vendor) {
    if (node.vendor)
      _.extend(node.vendor, updatenode.vendor);
    else
      node.vendor = updatenode.vendor;
    delete (updatenode.vendor);
}*/
_.extend(node, updatenode);

console.log('updated node', node);
