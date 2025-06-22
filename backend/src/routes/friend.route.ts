import { Router } from "express";
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  blockUser, 
  getFriends, 
  getPendingRequests, 
  unfriend 
} from "../controllers/friend.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const friendRouter = Router();

// Friend request routes
// @ts-ignore
friendRouter.post("/request/send", authMiddleware, sendFriendRequest);
// @ts-ignore
friendRouter.post("/request/accept", authMiddleware, acceptFriendRequest);
// @ts-ignore
friendRouter.post("/request/reject", authMiddleware, rejectFriendRequest);

// Friend management routes
// @ts-ignore
friendRouter.post("/block", authMiddleware, blockUser);
// @ts-ignore
friendRouter.post("/unfriend", authMiddleware, unfriend);

// Friend listing routes
// @ts-ignore
friendRouter.get("/list", authMiddleware, getFriends);
// @ts-ignore
friendRouter.get("/requests/pending", authMiddleware, getPendingRequests);

export default friendRouter;
