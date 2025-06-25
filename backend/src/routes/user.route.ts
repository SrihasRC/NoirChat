import { Router } from "express";
import { 
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
  getUserByUsername,
  searchUsers,
  getUserActivity
} from "../controllers/user.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const userRouter = Router();

// Get current user's profile
// @ts-ignore
userRouter.get("/profile", authMiddleware, getUserProfile);

// Update current user's profile
// @ts-ignore
userRouter.put("/profile", authMiddleware, updateUserProfile);

// Change password
// @ts-ignore
userRouter.put("/change-password", authMiddleware, changePassword);

// Delete user account
// @ts-ignore
userRouter.delete("/account", authMiddleware, deleteUserAccount);

// Get user by username
// @ts-ignore
userRouter.get("/:username", authMiddleware, getUserByUsername);

// Search users
// @ts-ignore
userRouter.get("/search", authMiddleware, searchUsers);

// Get user activity status
// @ts-ignore
userRouter.get("/activity", authMiddleware, getUserActivity);

export default userRouter;
