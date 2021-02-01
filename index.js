var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

const sessionList = []

io.on('connection', function(socket) {
  //服务端监听用户进入聊天室
  socket.on('newUser', function({userName}) {
    socket.userName = userName
    if(!sessionList.includes(userName)) {
      sessionList.push(userName)
    }

    //服务端广播用户加入聊天室信息
    io.emit('newUser', {
      userName,
      count: sessionList.length
    })

  })

  //服务端监听客户端发送的新消息
  socket.on('newMessage', function({userName, message}) {
    io.emit('newMessage', {
      userName,
      message
    })
  })

  socket.on('disconnect', function() {
    sessionList.splice(sessionList.indexOf(socket.userName), 1 );
    socket.broadcast.emit('userClosed', {
      userName: socket.userName,
      count: sessionList.length
    })
  })
})

http.listen(9009, function() {
  console.log('listening on *:9009')
})
