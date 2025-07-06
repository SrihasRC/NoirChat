import { Router } from "express";
import { 
  createRoom,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  getRoomMessages,
  getRooms,
  getRoomsWithUnreadCounts,
  markRoomAsRead,
  updateRoom,
  deleteRoom,
  searchRooms
} from "../controllers/room.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const roomRouter = Router();

// Create a new room
// @ts-ignore
roomRouter.post("/create", authMiddleware, createRoom);

// Join a room
// @ts-ignore
roomRouter.post("/join", authMiddleware, joinRoom);

// Leave a room
// @ts-ignore
roomRouter.post("/leave", authMiddleware, leaveRoom);

// Send a message to a room
// @ts-ignore
roomRouter.post("/message", authMiddleware, sendRoomMessage);

// Get messages from a specific room
// @ts-ignore
roomRouter.get("/:roomId/messages", authMiddleware, getRoomMessages);

// Mark all messages in a room as read
// @ts-ignore
roomRouter.put("/:roomId/read", authMiddleware, markRoomAsRead);

// Search for rooms
// @ts-ignore
roomRouter.get("/search", authMiddleware, searchRooms);

// Get all rooms for the authenticated user
// @ts-ignore
roomRouter.get("/", authMiddleware, getRooms);

// Get all rooms with unread counts for the authenticated user
// @ts-ignore
roomRouter.get("/with-unread-counts", authMiddleware, getRoomsWithUnreadCounts);

// Update a room (only creator can update)
// @ts-ignore
roomRouter.put("/:roomId", authMiddleware, updateRoom);

// Delete a room (only creator can delete)
// @ts-ignore
roomRouter.delete("/:roomId", authMiddleware, deleteRoom);

export default roomRouter;
