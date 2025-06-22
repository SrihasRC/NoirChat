import { Router } from "express";
import { 
  sendDirectMessage,
  getConversation,
  getUserConversations,
  deleteMessage,
  editMessage,
  markAsRead
} from "../controllers/message.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const messageRouter = Router();

// Message routes
// @ts-ignore
messageRouter.post("/send", authMiddleware, sendDirectMessage);
// @ts-ignore
messageRouter.get("/conversation/:username", authMiddleware, getConversation);
// @ts-ignore
messageRouter.get("/conversations", authMiddleware, getUserConversations);
// @ts-ignore
messageRouter.delete("/:messageId", authMiddleware, deleteMessage);
// @ts-ignore
messageRouter.put("/:messageId", authMiddleware, editMessage);
// @ts-ignore
messageRouter.post("/mark-read", authMiddleware, markAsRead);

export default messageRouter;
