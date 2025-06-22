import { Req, Res, Next } from "../types/express.ts";
import User from "../models/user.model.ts";
import bcrypt from "bcryptjs";

// Get user profile
export const getProfile = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// Update user profile
export const updateProfile = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;
    const { name, status, profilePic, preferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (status !== undefined) user.status = status;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (preferences) {
      // Ensure preferences object exists
      if (!user.preferences) {
        user.preferences = {
          theme: "system",
          notifications: true,
          readReceipts: true,
          typingIndicators: true
        };
      }
      
      if (preferences.theme) user.preferences.theme = preferences.theme;
      if (preferences.notifications !== undefined) user.preferences.notifications = preferences.notifications;
      if (preferences.readReceipts !== undefined) user.preferences.readReceipts = preferences.readReceipts;
      if (preferences.typingIndicators !== undefined) user.preferences.typingIndicators = preferences.typingIndicators;
    }

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// Change password
export const changePassword = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    next(err);
  }
};

// Get user by username
export const getUserByUsername = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('-password -email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// Search users
export const searchUsers = async (req: Req, res: Res, next: Next) => {
  try {
    const { query = "", page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.toString().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username name profilePic status isOnline lastSeen')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

    res.status(200).json({
      success: true,
      message: "Users search completed",
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: users.length === Number(limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update online status
export const updateOnlineStatus = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;
    const { isOnline } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isOnline = isOnline;
    if (!isOnline) {
      user.lastSeen = new Date();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Online status updated successfully"
    });
  } catch (err) {
    next(err);
  }
};

// Get user activity status
export const getUserActivity = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('username isOnline lastSeen');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User activity retrieved successfully",
      data: {
        username: user.username,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (err) {
    next(err);
  }
};
