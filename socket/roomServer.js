/**
 * 多人房间server
 * */
var { SocketType, NotificationType, RequestMethod } = require('./constans')
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    origins: "*:*"
});

var url = 'http://localhost:9002';

var port = 9002;

var msgId = 1;

//房间用户名单
var roomInfo = {};

io.on('connection', function(socket) {
    const user = socket.handshake.query;
    console.log('start connection: ', user);

    const room = user.room;

    socket.join(room);

    //当前房间内的人
    var usersInRoom = io.sockets.adapter.rooms[room];
    console.log('usersInRoom: ', usersInRoom);

    const userOpt = {
        id: socket.id,
        username: user.name,
        room: room,
    };

    if (!roomInfo[room]) {
        roomInfo[room] = {
            users: {
                [userOpt.id]: userOpt
            }
        }
    } else {
        roomInfo[room].users[userOpt.id] = userOpt;
    }

    sendSelfNotification(NotificationType.roomReady, { messages: roomInfo[room].message || [], users: Object.values(roomInfo[room].users), room: room }, room);
    sendOtherUsersNotification(NotificationType.newUser, userOpt, room);

    //服务端监听客户端发送的新消息
    socket.on('request', function({method, data}) {
        const socketQuery = socket.handshake.query;
        const room = user.room;
        if (method === RequestMethod.leave) {
            if (!roomInfo[room]) {
                return;
            }
            delete roomInfo[room].users[socket.id];
            socket.leave(room)
            sendOtherUsersNotification(NotificationType.userClosed, socket.id, room)
        } else if (method === RequestMethod.sendMsg) {
            const opt = { username: socketQuery.name, message: data, id: msgId}
            if(roomInfo[room].message) {
                roomInfo[room].message.push(opt);
            } else {
                roomInfo[room].message = [opt]
            }
            msgId++;
            sendOtherUsersNotification(NotificationType.newMessage, opt, room)
        }
    })

    socket.on('disconnect', function() {
        const socketQuery = socket.handshake.query;
        console.log('disconnect: ', socketQuery)
    })

    //发送给其他人的消息
    function sendOtherUsersNotification(method, data, room) {
        console.log('sendOtherUsersNotification method data', method, data);
        socket.broadcast.to(room).emit('notification', { method, data });
    }

    //发送给自己的信息
    function sendSelfNotification(method, data, room) {
        console.log('sendSelfNotification method data', method, data);
        socket.emit('notification', { method, data });
    }
})

server.listen(port, function() {
    console.log('App listening on port 9002!');
});
