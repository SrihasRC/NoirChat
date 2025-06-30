import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.ts";
import User from "../models/user.model.ts";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

let ioInstance: Server | null = null;

export const getSocketIO = () => ioInstance;

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  ioInstance = io;

  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.username} connected`);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    }).exec();

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Handle joining a chat room
    socket.on("join_room", (roomId: string) => {
      socket.join(`room_${roomId}`);
      socket.to(`room_${roomId}`).emit("user_joined", {
        userId: socket.userId,
        username: socket.username,
      });
    });

    // Handle leaving a chat room
    socket.on("leave_room", (roomId: string) => {
      socket.leave(`room_${roomId}`);
      socket.to(`room_${roomId}`).emit("user_left", {
        userId: socket.userId,
        username: socket.username,
      });
    });

    // Handle sending messages to rooms
    socket.on("send_room_message", (data) => {
      socket.to(`room_${data.roomId}`).emit("new_room_message", {
        ...data,
        sender: {
          _id: socket.userId,
          username: socket.username,
        },
        timestamp: new Date(),
      });
    });

    // Handle sending direct messages
    socket.on("send_direct_message", (data) => {
      // Send to recipient
      socket.to(`user_${data.receiverId}`).emit("new_direct_message", {
        ...data,
        sender: {
          _id: socket.userId,
          username: socket.username,
        },
        timestamp: new Date(),
      });
    });

    // Handle typing indicators
    socket.on("typing_start", (data) => {
      if (data.roomId) {
        socket.to(`room_${data.roomId}`).emit("user_typing", {
          userId: socket.userId,
          username: socket.username,
          roomId: data.roomId,
        });
      } else if (data.receiverId) {
        socket.to(`user_${data.receiverId}`).emit("user_typing", {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    socket.on("typing_stop", (data) => {
      if (data.roomId) {
        socket.to(`room_${data.roomId}`).emit("user_stopped_typing", {
          userId: socket.userId,
          roomId: data.roomId,
        });
      } else if (data.receiverId) {
        socket.to(`user_${data.receiverId}`).emit("user_stopped_typing", {
          userId: socket.userId,
        });
      }
    });

    // Handle message read receipts
    socket.on("message_read", (data) => {
      if (data.senderId) {
        socket.to(`user_${data.senderId}`).emit("message_read_receipt", {
          messageId: data.messageId,
          readBy: socket.userId,
          readAt: new Date(),
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.username} disconnected`);

      // Update user offline status
      User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).exec();
    });
  });

  return io;
};
