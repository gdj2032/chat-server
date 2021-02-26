let dgram = require('dgram');

let socket = dgram.createSocket('udp4');

socket.on('listening', function () {
    var address = socket.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

// 服务端监听一个端口 数据到来时 可以读出信息
socket.bind(9999,'localhost',function(){
    //读取消息
    socket.on('message',function(data,rinfo){
        console.log(data.toString());
        //发送消息
        socket.send('hello',rinfo.port);
    })
});
