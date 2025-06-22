import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PORT } from './config/env.ts';
import connectToDatabase from './db/mongodb.ts';
import authRouter from './routes/auth.route.ts';
import friendRouter from './routes/friend.route.ts';
import messageRouter from './routes/message.route.ts';
import roomRouter from './routes/room.route.ts';
import userRouter from './routes/user.route.ts';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './types/socket.ts'; // Import socket type extensions
import User from './models/user.model.ts';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/friends', friendRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/users', userRouter);

app.get('/', (req, res) => {
  res.send('Welcome to NoirChat API');
});

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication and joining
  socket.on('join', async (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(userId); // Join a room with their user ID
    console.log(`User ${userId} joined with socket ${socket.id}`);
    
    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true });
    
    // Notify friends that user is online
    socket.broadcast.emit('user-online', userId);
  });

  // Handle direct message sending
  socket.on('send-message', async (data) => {
    try {
      const { receiverId, content, messageType = 'text', fileUrl = '', fileName = '', fileSize = 0 } = data;
      
      // Emit to receiver if they're online
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', {
          senderId: socket.userId,
          content,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          timestamp: new Date()
        });
      }

      // Send confirmation back to sender
      socket.emit('message-sent', {
        receiverId,
        content,
        messageType,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle room message sending
  socket.on('send-room-message', async (data) => {
    try {
      const { roomId, content, messageType = 'text', fileUrl = '', fileName = '', fileSize = 0 } = data;
      
      // Emit to all users in the room
      socket.to(roomId).emit('receive-room-message', {
        roomId,
        senderId: socket.userId,
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        timestamp: new Date()
      });

      // Send confirmation back to sender
      socket.emit('room-message-sent', {
        roomId,
        content,
        messageType,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send room message' });
    }
  });

  // Handle joining rooms for real-time updates
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined-room', {
      userId: socket.userId,
      roomId
    });
  });

  // Handle leaving rooms
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left-room', {
      userId: socket.userId,
      roomId
    });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  socket.on('message-read', (data) => {
    const { senderId, messageId } = data;
    const senderSocketId = connectedUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message-read-receipt', {
        messageId,
        readBy: socket.userId,
        readAt: new Date()
      });
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false, 
        lastSeen: new Date() 
      });
      
      socket.broadcast.emit('user-offline', socket.userId);
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDatabase();
});