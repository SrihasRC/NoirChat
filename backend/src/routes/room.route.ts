import { Router } from "express";
import { 
  createRoom,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  getRoomMessages,
  getUserRooms,
  getPublicRooms,
  updateRoom,
  deleteRoom
} from "../controllers/room.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const roomRouter = Router();

// Room management routes
// @ts-ignore
roomRouter.post("/create", authMiddleware, createRoom);
// @ts-ignore
roomRouter.post("/:roomId/join", authMiddleware, joinRoom);
// @ts-ignore
roomRouter.post("/:roomId/leave", authMiddleware, leaveRoom);
// @ts-ignore
roomRouter.put("/:roomId", authMiddleware, updateRoom);
// @ts-ignore
roomRouter.delete("/:roomId", authMiddleware, deleteRoom);

// Room message routes
// @ts-ignore
roomRouter.post("/:roomId/message", authMiddleware, sendRoomMessage);
// @ts-ignore
roomRouter.get("/:roomId/messages", authMiddleware, getRoomMessages);

// Room listing routes
// @ts-ignore
roomRouter.get("/my-rooms", authMiddleware, getUserRooms);
// @ts-ignore
roomRouter.get("/public", authMiddleware, getPublicRooms);

export default roomRouter;
