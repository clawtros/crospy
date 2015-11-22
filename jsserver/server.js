var io = require('socket.io').listen(3000),
    keyPresses = {};

function getRoomPresses(room) {
  if (keyPresses[room] === undefined) {
    keyPresses[room] = [];
  }
  return keyPresses[room];
}

function getRoomSummary(room) {
  var summary = {};
  for (var press of getRoomPresses(data.room)) {
    summary[press.cellId] = press;
  }
  return summary;
}

io.sockets.on('connection', function (socket) {
  
  socket.on('key pressed', function(data) {
    socket.broadcast.to(data.room).emit('key pressed', data);
    getRoomPresses(data.room).push(data);
  });

  socket.on('join', function(data) {
    socket.join(data.room);
    for (var press of getRoomPresses(data.room)) {
      io.to(data.room).emit('key pressed', press);  
    }
  });

  socket.on('create room', function(data) {
    socket.join(data.room);
  });


});
