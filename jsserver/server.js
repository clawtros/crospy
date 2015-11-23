var io = require('socket.io').listen(3000),
    keyPresses = {},
    keySummary = {};

function getRoomPresses(room) {
  if (keyPresses[room] === undefined) {
    keyPresses[room] = [];
  }
  return keyPresses[room];
}

function getRoomSummary(room) {
  if (keySummary[room] === undefined) {
    keySummary[room] = {};
  }
  return keySummary[room];
}

io.sockets.on('connection', function (socket) {
  
  socket.on('key pressed', function(data) {
    socket.broadcast.to(data.room).emit('key pressed', data);
    getRoomPresses(data.room).push(data);
    getRoomSummary(data.room)[data.cellId] = data;
  });

  socket.on('join', function(data) {
    socket.join(data.room);
    socket.emit('key summary', getRoomSummary(data.room));
  });

  socket.on('create room', function(data) {
    socket.join(data.room);
  });


});
