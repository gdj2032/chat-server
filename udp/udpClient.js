let dgram = require('dgram');
//创建socket
let socket = dgram.createSocket('udp4');
//发送消息
socket.send('hello',9999,function(){
    console.log('成功')
});
//接收消息
socket.on('message',function(data){
    console.log(data.toString());
})
socket.on('connect', function (data) {
    console.log('connect data: ', data);
})
socket.on('close', function (data) {
    console.log('close data: ', data);
})
