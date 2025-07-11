import { Req, Res, Next } from "../types/express.ts";
import User from "../models/user.model.ts";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("username name email");

    if (!user) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
}

export const updateUserProfile = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;
    const { name, username, email, bio, profilePic } = req.body;

    if (!name && !username && !email && !bio && !profilePic) {
      const error: any = new Error("At least one field is required to update");
      error.status = 400;
      throw error;
    }

    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        const error: any = new Error("Username is already taken");
        error.status = 409;
        throw error;
      }
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        const error: any = new Error("Email is already taken");
        error.status = 409;
        throw error;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

export const changePassword = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error: any = new Error("Current password and new password are required");
      error.status = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const error: any = new Error("Current password is incorrect");
      error.status = 401;
      throw error;
    }

    if (newPassword.length < 6) {
      const error: any = new Error("New password must be at least 6 characters long");
      error.status = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    next(error);
  }
}

export const deleteUserAccount = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "User account deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

export const getUserByUsername = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.params;

    if (!username) {
      const error: any = new Error("Username is required");
      error.status = 400;
      throw error;
    }

    const user = await User.findOne({ username }).select("username name email profilePic");

    if (!user) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
}

export const searchUsers = async (req: Req, res: Res, next: Next) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      const error: any = new Error("Search query is required");
      error.status = 400;
      throw error;
    }

    const users = await User.find({
      $or: [
        { username: new RegExp(query, 'i') },
        { name: new RegExp(query, 'i') }
      ]
    }).select("username name profilePic");

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
}

export const getUserActivity = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("username lastSeen isOnline");

    if (!user) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      activity: {
        username: user.username,
        lastSeen: user.lastSeen,
        isOnline: user.isOnline
      }
    });
  } catch (error) {
    next(error);
  }
}