# NoirChat API Documentation

## Authentication Endpoints

### POST /api/v1/auth/sign-up
Register a new user.
```json
{
  "username": "string",
  "name": "string",
  "email": "string",
  "password": "string"
}
```

### POST /api/v1/auth/sign-in
Login with email and password.
```json
{
  "email": "string",
  "password": "string"
}
```

## User Endpoints

### GET /api/v1/users/profile
Get current user profile (requires authentication).

### PUT /api/v1/users/profile
Update user profile (requires authentication).
```json
{
  "name": "string",
  "status": "string",
  "profilePic": "string",
  "preferences": {
    "theme": "light|dark|system",
    "notifications": "boolean",
    "readReceipts": "boolean",
    "typingIndicators": "boolean"
  }
}
```

### PUT /api/v1/users/change-password
Change user password (requires authentication).
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### GET /api/v1/users/search?query=string&page=1&limit=20
Search for users (requires authentication).

### GET /api/v1/users/:username
Get user by username (requires authentication).

### GET /api/v1/users/:username/activity
Get user's online activity status (requires authentication).

### PUT /api/v1/users/status
Update online status (requires authentication).
```json
{
  "isOnline": "boolean"
}
```

## Friend Endpoints

### POST /api/v1/friends/request/send
Send a friend request (requires authentication).
```json
{
  "username": "string"
}
```

### POST /api/v1/friends/request/accept
Accept a friend request (requires authentication).
```json
{
  "username": "string"
}
```

### POST /api/v1/friends/request/reject
Reject a friend request (requires authentication).
```json
{
  "username": "string"
}
```

### POST /api/v1/friends/block
Block a user (requires authentication).
```json
{
  "username": "string"
}
```

### POST /api/v1/friends/unfriend
Unfriend a user (requires authentication).
```json
{
  "username": "string"
}
```

### GET /api/v1/friends/list
Get list of friends (requires authentication).

### GET /api/v1/friends/requests/pending
Get pending friend requests (requires authentication).

## Message Endpoints

### POST /api/v1/messages/send
Send a direct message (requires authentication).
```json
{
  "receiverUsername": "string",
  "content": "string",
  "messageType": "text|image|file|voice|video",
  "fileUrl": "string",
  "fileName": "string",
  "fileSize": "number"
}
```

### GET /api/v1/messages/conversation/:username?page=1&limit=50
Get conversation with a user (requires authentication).

### GET /api/v1/messages/conversations
Get all conversations (requires authentication).

### DELETE /api/v1/messages/:messageId
Delete a message (requires authentication).

### PUT /api/v1/messages/:messageId
Edit a message (requires authentication).
```json
{
  "content": "string"
}
```

### POST /api/v1/messages/mark-read
Mark messages as read (requires authentication).
```json
{
  "username": "string"
}
```

### GET /api/v1/messages/search?query=string&type=all&page=1&limit=20
Search messages (requires authentication).

### GET /api/v1/messages/stats
Get message statistics (requires authentication).

### POST /api/v1/messages/:messageId/reaction
Add reaction to message (requires authentication).
```json
{
  "emoji": "string"
}
```

### DELETE /api/v1/messages/:messageId/reaction
Remove reaction from message (requires authentication).
```json
{
  "emoji": "string"
}
```

### POST /api/v1/messages/:messageId/reply
Reply to a message (requires authentication).
```json
{
  "content": "string",
  "receiverUsername": "string", // for direct messages
  "roomId": "string" // for room messages
}
```

## Room Endpoints

### POST /api/v1/rooms/create
Create a new room (requires authentication).
```json
{
  "name": "string",
  "description": "string",
  "isPrivate": "boolean",
  "maxMembers": "number"
}
```

### POST /api/v1/rooms/:roomId/join
Join a room (requires authentication).

### POST /api/v1/rooms/:roomId/leave
Leave a room (requires authentication).

### PUT /api/v1/rooms/:roomId
Update room settings (requires authentication, admin only).
```json
{
  "name": "string",
  "description": "string",
  "isPrivate": "boolean",
  "maxMembers": "number"
}
```

### DELETE /api/v1/rooms/:roomId
Delete a room (requires authentication, owner only).

### POST /api/v1/rooms/:roomId/message
Send message to room (requires authentication).
```json
{
  "content": "string",
  "messageType": "text|image|file|voice|video",
  "fileUrl": "string",
  "fileName": "string",
  "fileSize": "number"
}
```

### GET /api/v1/rooms/:roomId/messages?page=1&limit=50
Get room messages (requires authentication).

### GET /api/v1/rooms/my-rooms
Get user's rooms (requires authentication).

### GET /api/v1/rooms/public?page=1&limit=20
Get public rooms (requires authentication).

## Socket.IO Events

### Client to Server Events

- `join` - Join with userId
- `send-message` - Send direct message
- `send-room-message` - Send room message
- `join-room` - Join room for real-time updates
- `leave-room` - Leave room
- `typing` - Send typing indicator
- `message-read` - Send read receipt

### Server to Client Events

- `receive-message` - Receive direct message
- `receive-room-message` - Receive room message
- `message-sent` - Message sent confirmation
- `room-message-sent` - Room message sent confirmation
- `user-online` - User came online
- `user-offline` - User went offline
- `user-joined-room` - User joined room
- `user-left-room` - User left room
- `user-typing` - User typing indicator
- `message-read-receipt` - Message read receipt
- `error` - Error occurred

## Response Format

All API responses follow this format:
```json
{
  "success": "boolean",
  "message": "string",
  "data": "object|array|null"
}
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Or the token will be sent as an HTTP-only cookie after login.

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
