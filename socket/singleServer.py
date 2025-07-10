from typing import Dict, List
from flask import Flask, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
# socketio = SocketIO(app, cors_allowed_origins="http://localhost:8999")
socketio = SocketIO(app, cors_allowed_origins="*")

# 服务端信息枚举
class ServerMessageEnum():
    notification = 'notification'
    request = 'request'

# 通知客户端信息枚举
class NotificationEnum():
    newUser = 'newUser'
    roomReady = 'roomReady'
    userClosed = 'userClosed'
    newMessage = 'newMessage'

# 请求客户端信息枚举
class RequestEnum():
    leave = 'leave'
    sendMsg = 'sendMsg'

# 用户信息类
class User:
    def __init__(self, id: str, username: str):
        self.id = id
        self.username = username

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username
        }

# 消息信息类
class Message:
    def __init__(self, username: str, message: str, id: int):
        self.username = username
        self.message = message
        self.id = id

    def to_dict(self):
        return {
            'username': self.username,
            'message': self.message,
            'id': self.id
        }

# Socket.io 响应类
class SocketIoRes:
    def __init__(self, method: str, data):
        self.method = method
        self.data = data

    def to_dict(self):
        # 确保 data 是可序列化的
        if hasattr(self.data, 'to_dict'):
            data = self.data.to_dict()
        elif isinstance(self.data, (list, dict, str, int, float, bool, type(None))):
            data = self.data
        elif isinstance(self.data, (tuple, set)):
            data = list(self.data)
        else:
            data = str(self.data)
        return {
            'method': self.method,
            'data': data
        }

users: Dict[str, User] = {}
messages: List[Message] = []
msg_id = 1

@socketio.on('connect')
def handle_connect(auth=None):  # 添加 auth 参数
    user_name = request.args.get('name')
    if not user_name:
        socketio.disconnect(request.sid)
        print("Connection denied: No username provided")
        return
    user = User(request.sid, user_name)
    users[user.id] = user
    newUserRes = SocketIoRes(NotificationEnum.newUser, user.to_dict())
    emit(ServerMessageEnum.notification, newUserRes.to_dict(), broadcast=True)
    users_dict = [user.to_dict() for user in users.values()]
    messages_dict = [message.to_dict() for message in messages]
    roomReadyRes = SocketIoRes(NotificationEnum.roomReady, {'messages': messages_dict, 'users': users_dict})
    emit(ServerMessageEnum.notification, roomReadyRes.to_dict(), broadcast=True)
    print(f"start connection: {user}")

@socketio.on(ServerMessageEnum.request)
def handle_request(data):
    global msg_id
    res = SocketIoRes(data['method'], data['data'])
    if res.method == RequestEnum.leave:
        user_id = request.sid
        if user_id in users:
            user_opt = users[user_id]
            del users[user_id]
            userClosedRes = SocketIoRes(NotificationEnum.userClosed, user_opt.to_dict())
            emit(ServerMessageEnum.notification, userClosedRes.to_dict(), broadcast=True)
            print(f"disconnect: {user_opt}")
        socketio.close_room(user_id)
    elif res.method == RequestEnum.sendMsg:
        user_id = request.sid
        if user_id not in users:
            print(f"User not found: {user_id}")
            return
        user_name = users[user_id].username
        opt = Message(user_name, res.data, msg_id)
        messages.append(opt)
        msg_id += 1
        newMessageRes = SocketIoRes(NotificationEnum.newMessage, opt.to_dict())
        emit(ServerMessageEnum.notification, newMessageRes.to_dict(), broadcast=True)
        print(f"new message: {opt}")
    else:
        print("Unknown method")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    if user_id in users:
        user_opt = users[user_id]
        del users[user_id]
        userClosedRes = SocketIoRes(NotificationEnum.userClosed, user_opt.to_dict())
        emit(ServerMessageEnum.notification, userClosedRes.to_dict(), broadcast=True)
        print(f"disconnect: {user_opt}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=9001)
