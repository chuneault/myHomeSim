var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var middleware = require('socketio-wildcard')();


io.of('logs').on('connection', function(socket){
  socket.on('mqttBroker', function(log) {
     console.log(log.message);
  });

});

http.listen(3030, function(){
  console.log('listening on *:3030');
});
