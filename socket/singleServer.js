var { SocketType, NotificationType, RequestMethod } = require('./constans')
var app = require('express')();
//通过http模块Server方法获取关联Express的服务对象
var server = require('http').Server(app);
//导入socket.io模块获取io对象并关联http服务对象
var io = require('socket.io')(server, {
  origins: "*:*"
});

var url = 'http://localhost:9001';

var port = 9001;

var users = {};

var messages = [];

var msgId = 1;

io.on('connection', function(socket) {
  const user = socket.handshake.query;
  console.log('start connection: ', user);

  const userOpt = {
    id: socket.id,
    username: user.name,
  }
  users[userOpt.id] = userOpt;

  sendSelfNotification(NotificationType.roomReady, { messages, users: Object.values(users) });
  sendOtherUsersNotification(NotificationType.newUser, userOpt);

  //服务端监听客户端发送的新消息
  socket.on('request', function({method, data}, cb) {
    const socketQuery = socket.handshake.query;
    if (method === RequestMethod.leave) {
      delete users[socket.id];
      sendOtherUsersNotification(NotificationType.userClosed, socket.id)
    } else if (method === RequestMethod.sendMsg) {
      const opt = { username: socketQuery.name, message: data, id: msgId }
      messages.push(opt);
      msgId++;
      sendOtherUsersNotification(NotificationType.newMessage, opt)
    }
  })

  socket.on('disconnect', function() {
    const socketQuery = socket.handshake.query;
    console.log('disconnect: ', socketQuery)
  })

  //发送给其他人的消息
  function sendOtherUsersNotification(method, data) {
    console.log('sendOtherUsersNotification method data', method, data);
    socket.broadcast.emit('notification', { method, data });
  }

  //发送给自己的信息
  function sendSelfNotification(method, data) {
    console.log('sendSelfNotification method data', method, data);
    socket.emit('notification', { method, data });
  }
})

server.listen(port, function() {
  console.log('App listening on port 9001!');
});
