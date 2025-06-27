import { Req, Res, Next } from "../types/express.ts";
import Friend from "../models/friend.model.ts";
import User from "../models/user.model.ts";

export const addFriend = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;
    
    if (!username) {
      const error: any = new Error("Username is required");
      error.status = 400;
      throw error;
    }
    
    // Find the user by username
    const friendUser = await User.findOne({ username });
    if (!friendUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    const friendId = friendUser._id;
    
    if (userId.toString() === friendId.toString()) {
      const error: any = new Error("You cannot add yourself as a friend");
      error.status = 400;
      throw error;
    }

    // Check if already friends
    const existing = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (existing) {
      const error: any = new Error("Already friends");
      error.status = 400;
      throw error;
    }

    // Directly create friendship without pending status
    const friendship = await Friend.create({
      requester: userId,
      recipient: friendId,
      status: "accepted"
    });

    // Populate user information for better response
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(201).json({
      success: true,
      message: "Friend added successfully",
      data: friendship
    });
  } catch (err) {
    next(err);
  }
};

export const getFriends = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" }
      ]
    }).populate("requester recipient", "username name email profilePic");

    const friends = friendships.map(f => {
      return f.requester._id.toString() === userId.toString() ? f.recipient : f.requester;
    });

    res.status(200).json({
      success: true, 
      message: "Friends retrieved successfully",
      data: friends
    });
  } catch (err) {
    next(err);
  }
};

export const removeFriend = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;
    
    if (!username) {
      const error: any = new Error("Username is required");
      error.status = 400;
      throw error;
    }
    
    // Find the friend by username
    const friendUser = await User.findOne({ username });
    if (!friendUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    const friendId = friendUser._id;

    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: userId, status: "accepted" }
      ]
    });

    if (!friendship) {
      const error: any = new Error("Friendship not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Friend removed successfully"
    });
  } catch (err) {
    next(err);
  }
};
