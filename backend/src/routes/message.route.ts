import { Router } from "express";
import { 
  sendDirectMessage,
  getConversation,
  getUserConversations,
  deleteMessage,
  editMessage,
  getUnreadMessagesCount,
  markAsRead,
  searchMessages,
  getMessageStats
} from "../controllers/message.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const messageRouter = Router();

// Send a direct message
// @ts-ignore
messageRouter.post("/send", authMiddleware, sendDirectMessage);

// Get conversation with a specific user
// @ts-ignore
messageRouter.get("/conversation/:username", authMiddleware, getConversation);

// Get all conversations for the current user
// @ts-ignore
messageRouter.get("/conversations", authMiddleware, getUserConversations);

// Delete a message
// @ts-ignore
messageRouter.delete("/:messageId", authMiddleware, deleteMessage);

// Edit a message
// @ts-ignore
messageRouter.put("/:messageId", authMiddleware, editMessage);

// Get unread messages count
// @ts-ignore
messageRouter.get("/unread/count", authMiddleware, getUnreadMessagesCount);

// Mark a message as read
// @ts-ignore
messageRouter.put("/:messageId/read", authMiddleware, markAsRead);

// Search messages
// @ts-ignore
messageRouter.get("/search", authMiddleware, searchMessages);

// Get message statistics
// @ts-ignore
messageRouter.get("/stats", authMiddleware, getMessageStats);

export default messageRouter;
