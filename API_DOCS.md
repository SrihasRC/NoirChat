# NoirChat API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All protected endpoints require a JWT token. Include the token in cookies or Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Body:**
```json
{
  "username": "johndoe",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token"
}
```

### Login User
**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token"
}
```

### Logout User
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👤 User Endpoints

### Get Current User Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePic": "avatar_url",
    "bio": "User bio"
  }
}
```

### Update User Profile
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio",
  "profilePic": "new_avatar_url"
}
```

### Change Password
**PUT** `/users/change-password`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Get User by Username
**GET** `/users/:username`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePic": "avatar_url"
  }
}
```

### Search Users
**GET** `/users/search?query=john`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "username": "johndoe",
      "name": "John Doe",
      "profilePic": "avatar_url"
    }
  ]
}
```

### Get User Activity
**GET** `/users/activity`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "activity": {
    "username": "johndoe",
    "lastSeen": "2024-01-01T12:00:00Z",
    "isOnline": true
  }
}
```

### Delete Account
**DELETE** `/users/account`

**Headers:** `Authorization: Bearer <token>`

---

## 👥 Friends Endpoints

### Add Friend
**POST** `/friends/add`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "janedoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend added successfully",
  "data": {
    "_id": "friendship_id",
    "requester": {
      "_id": "user_id",
      "username": "johndoe",
      "name": "John Doe"
    },
    "recipient": {
      "_id": "user_id",
      "username": "janedoe",
      "name": "Jane Doe"
    },
    "status": "accepted"
  }
}
```

### Get Friends List
**GET** `/friends/`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Friends retrieved successfully",
  "data": [
    {
      "_id": "user_id",
      "username": "janedoe",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  ]
}
```

### Remove Friend
**DELETE** `/friends/remove`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "janedoe"
}
```

---

## 💬 Messages Endpoints

### Send Direct Message
**POST** `/messages/send`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "receiverUsername": "janedoe",
  "content": "Hello Jane!",
  "messageType": "text",
  "fileUrl": "",
  "fileName": "",
  "fileSize": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "message_id",
    "sender": "sender_id",
    "receiver": "receiver_id",
    "content": "Hello Jane!",
    "messageType": "text",
    "isRead": false,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### Get Conversation
**GET** `/messages/conversation/:username`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": [
    {
      "_id": "message_id",
      "sender": {
        "_id": "user_id",
        "username": "johndoe",
        "name": "John Doe"
      },
      "receiver": {
        "_id": "user_id",
        "username": "janedoe",
        "name": "Jane Doe"
      },
      "content": "Hello!",
      "isRead": true,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Get All Conversations
**GET** `/messages/conversations`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "_id": "message_id",
      "sender": {
        "_id": "user_id",
        "username": "johndoe"
      },
      "receiver": {
        "_id": "user_id",
        "username": "janedoe"
      },
      "content": "Latest message",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Edit Message
**PUT** `/messages/:messageId`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Updated message content"
}
```

### Delete Message
**DELETE** `/messages/:messageId`

**Headers:** `Authorization: Bearer <token>`

### Mark Message as Read
**PUT** `/messages/:messageId/read`

**Headers:** `Authorization: Bearer <token>`

### Get Unread Messages Count
**GET** `/messages/unread/count`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Unread messages count retrieved successfully",
  "data": {
    "count": 5
  }
}
```

### Search Messages
**GET** `/messages/search?query=hello`

**Headers:** `Authorization: Bearer <token>`

### Get Message Statistics
**GET** `/messages/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Message statistics retrieved successfully",
  "data": {
    "totalMessages": 150,
    "unreadMessages": 5,
    "readMessages": 145
  }
}
```

---

## 🏠 Room Endpoints

### Create Room
**POST** `/rooms/create`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "My Chat Room",
  "members": ["user_id_1", "user_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "_id": "room_id",
    "name": "My Chat Room",
    "creator": "creator_id",
    "members": ["user_id_1", "user_id_2"],
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### Join Room
**POST** `/rooms/join`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "roomId": "room_id"
}
```

### Leave Room
**POST** `/rooms/leave`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "roomId": "room_id"
}
```

### Send Room Message
**POST** `/rooms/message`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "roomId": "room_id",
  "content": "Hello everyone!"
}
```

### Get Room Messages
**GET** `/rooms/:roomId/messages`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "message_id",
      "sender": {
        "_id": "user_id",
        "username": "johndoe",
        "name": "John Doe"
      },
      "content": "Hello everyone!",
      "room": "room_id",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Get User's Rooms
**GET** `/rooms/`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "_id": "room_id",
      "name": "My Chat Room",
      "creator": {
        "_id": "user_id",
        "username": "johndoe",
        "name": "John Doe"
      },
      "members": ["user_id_1", "user_id_2"],
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Update Room
**PUT** `/rooms/:roomId`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Updated Room Name",
  "description": "Updated room description"
}
```

### Delete Room
**DELETE** `/rooms/:roomId`

**Headers:** `Authorization: Bearer <token>`

---

## 🔌 WebSocket Events (Socket.IO)

### Connection
Connect to the WebSocket server with authentication:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events to Emit (Client → Server)

#### Join Room
```javascript
socket.emit('join_room', 'room_id');
```

#### Leave Room
```javascript
socket.emit('leave_room', 'room_id');
```

#### Send Room Message
```javascript
socket.emit('send_room_message', {
  roomId: 'room_id',
  content: 'Hello everyone!',
  messageType: 'text'
});
```

#### Send Direct Message
```javascript
socket.emit('send_direct_message', {
  receiverId: 'user_id',
  content: 'Hello!',
  messageType: 'text'
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  roomId: 'room_id', // or receiverId for direct messages
  receiverId: 'user_id'
});

// Stop typing
socket.emit('typing_stop', {
  roomId: 'room_id',
  receiverId: 'user_id'
});
```

#### Message Read Receipt
```javascript
socket.emit('message_read', {
  messageId: 'message_id',
  senderId: 'sender_id'
});
```

### Events to Listen (Server → Client)

#### New Messages
```javascript
// New room message
socket.on('new_room_message', (data) => {
  console.log('New room message:', data);
});

// New direct message
socket.on('new_direct_message', (data) => {
  console.log('New direct message:', data);
});
```

#### User Events
```javascript
// User joined room
socket.on('user_joined', (data) => {
  console.log('User joined:', data);
});

// User left room
socket.on('user_left', (data) => {
  console.log('User left:', data);
});
```

#### Typing Indicators
```javascript
// User is typing
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
});

// User stopped typing
socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data);
});
```

#### Read Receipts
```javascript
socket.on('message_read_receipt', (data) => {
  console.log('Message read:', data);
});
```

---

## 📋 Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🚀 Quick Start Example

### Frontend Setup with Socket.IO
```javascript
import io from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Listen for new messages
socket.on('new_direct_message', (message) => {
  // Handle new direct message
  console.log('New message:', message);
});

// Send a message
socket.emit('send_direct_message', {
  receiverId: 'target_user_id',
  content: 'Hello!',
  messageType: 'text'
});
```

### API Request Example
```javascript
// Login user
const response = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.token);
}
```

---

## 📝 Notes

1. **Authentication**: Most endpoints require JWT authentication
2. **Real-time**: Use Socket.IO for instant messaging and live updates
3. **File Upload**: File URLs should be handled by your file upload service
4. **CORS**: Currently configured for `http://localhost:3000`
5. **Environment**: Make sure to set up your `.env` file with required variables

Happy coding! 🚀
