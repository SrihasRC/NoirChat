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

// @ts-ignore
friendRouter.post("/send-request", authMiddleware, sendFriendRequest);
// @ts-ignore
friendRouter.post("/accept-request", authMiddleware, acceptFriendRequest);
// @ts-ignore
friendRouter.post("/reject-request", authMiddleware, rejectFriendRequest);

// @ts-ignore
friendRouter.post("/block-user", authMiddleware, blockUser);
// @ts-ignore
friendRouter.get("/friends", authMiddleware, getFriends);

// @ts-ignore
friendRouter.get("/pending-requests", authMiddleware, getPendingRequests);
// @ts-ignore
friendRouter.post("/unfriend", authMiddleware, unfriend);

export default friendRouter;