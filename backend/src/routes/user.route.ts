import { Router } from "express";
import { 
  getProfile,
  updateProfile,
  changePassword,
  getUserByUsername,
  searchUsers,
  updateOnlineStatus,
  getUserActivity
} from "../controllers/user.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const userRouter = Router();

// Profile routes
// @ts-ignore
userRouter.get("/profile", authMiddleware, getProfile);
// @ts-ignore
userRouter.put("/profile", authMiddleware, updateProfile);
// @ts-ignore
userRouter.put("/change-password", authMiddleware, changePassword);

// User lookup routes
// @ts-ignore
userRouter.get("/search", authMiddleware, searchUsers);
// @ts-ignore
userRouter.get("/:username", authMiddleware, getUserByUsername);
// @ts-ignore
userRouter.get("/:username/activity", authMiddleware, getUserActivity);

// Status routes
// @ts-ignore
userRouter.put("/status", authMiddleware, updateOnlineStatus);

export default userRouter;
