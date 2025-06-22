import { Router } from "express";
import { 
  sendDirectMessage,
  getConversation,
  getUserConversations,
  deleteMessage,
  editMessage,
  markAsRead,
  searchMessages,
  getMessageStats
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
// @ts-ignore
messageRouter.get("/search", authMiddleware, searchMessages);
// @ts-ignore
messageRouter.get("/stats", authMiddleware, getMessageStats);

export default messageRouter;
