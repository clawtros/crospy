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

  function getRoom() {
    var room = io.nsps['/'].adapter.rooms[socket.currentRoom];
    if (room !== undefined) {
      return Object.keys(room);
    }
    return [];
  }

  socket.on('chat', function(data) {
    
  }

  socket.on('key pressed', function(data) {
    var summary = getRoomSummary(data.room);
    if (!summary[data.cellId] || summary[data.cellId].character != data.character) {
      socket.broadcast.to(data.room).emit('key pressed', data);
      getRoomPresses(data.room).push(data);
      summary[data.cellId] = data;
    }
  });

  socket.on('join', function(data) {
    var roster = getRoom(data.room);

    socket.join(data.room);
    socket.currentRoom = data.room;
    socket.emit('key summary', getRoomSummary(data.room));
    socket.broadcast.to(data.room).emit('roster', roster);
    socket.emit('roster', roster);
  });

  socket.on('disconnect', function() {
    if (socket.currentRoom !== undefined) {
      var room = getRoom(socket.currentRoom);
      if (room) {
        socket.broadcast.to(socket.currentRoom).emit(
          'roster',
          room);        
      }
    }
  })

});
