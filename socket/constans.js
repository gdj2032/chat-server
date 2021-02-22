var SocketType = {
    notification: 'notification',
    request: 'request',
    newMessage: 'newMessage',
}

var NotificationType = {
    roomReady: 'roomReady',
    newMessage: 'newMessage',
    newUser: 'newUser',
    userClosed: 'userClosed',
}

var RequestMethod = {
    leave: 'leave',
    sendMsg: 'sendMsg',
}

module.exports = {
    SocketType,
    NotificationType,
    RequestMethod,
};
