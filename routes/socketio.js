let io;
let init = server => {
  io = require('socket.io')(server);

  io.on('connection', function (socket) {
    Log.info('socketio connection: ' + socket.id);

    socket.on('login', function (name) {
      socket.username = name;

      io.emit('msg', name + ' login');
      //socket.broadcast.emit('msg', name + ' login');
      Log.info(name + ' login');
    })

    socket.on('disconnect', function () {
      Log.info(socket.username + ' disconnected');
      io.emit('msg', socket.username + ' disconnected');
    });

    socket.on('msg', function (content) {
      Log.info(socket.username + ': ' + content);
      io.emit('msg', socket.username + ': ' + content);
      //socket.broadcast.emit('msg', socket.username + ': ' + content);
    });

  });
}

module.exports = {
  init
}