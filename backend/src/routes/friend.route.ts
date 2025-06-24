import { Router } from "express";
import { 
  addFriend, 
  getFriends, 
  removeFriend 
} from "../controllers/friend.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const friendRouter = Router();

// @ts-ignore
friendRouter.post("/add", authMiddleware, addFriend);
// @ts-ignore
friendRouter.get("/", authMiddleware, getFriends);
// @ts-ignore
friendRouter.delete("/remove", authMiddleware, removeFriend);

export default friendRouter;