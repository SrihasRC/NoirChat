import { Req, Res, Next } from "../types/express.ts";
import Friend from "../models/friend.model.ts";
import User from "../models/user.model.ts";

export const sendFriendRequest = async (req: Req, res: Res, next: Next) => {
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

    const existing = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (existing) {
      const error: any = new Error("Friend request already exists or you're already friends");
      error.status = 400;
      throw error;
    }

    const friendship = await Friend.create({
      requester: userId,
      recipient: friendId,
      status: "pending"
    });

    // Populate user information for better response
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      data: friendship
    });
  } catch (err) {
    next(err);
  }
};

export const acceptFriendRequest = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;
    
    if (!username) {
      const error: any = new Error("Username is required");
      error.status = 400;
      throw error;
    }
    
    // Find the requester by username
    const requesterUser = await User.findOne({ username });
    if (!requesterUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    const requesterId = requesterUser._id;

    const friendship = await Friend.findOneAndUpdate(
      { requester: requesterId, recipient: userId, status: "pending" },
      { status: "accepted", actionUser: userId },
      { new: true }
    );

    if (!friendship) {
      const error: any = new Error("Friend request not found");
      error.status = 404;
      throw error;
    }

    // Populate user information
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
      data: friendship
    });
  } catch (err) {
    next(err);
  }
};

export const rejectFriendRequest = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;
    
    if (!username) {
      const error: any = new Error("Username is required");
      error.status = 400;
      throw error;
    }
    
    // Find the requester by username
    const requesterUser = await User.findOne({ username });
    if (!requesterUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    const requesterId = requesterUser._id;

    const friendship = await Friend.findOneAndUpdate(
      { requester: requesterId, recipient: userId, status: "pending" },
      { status: "rejected", actionUser: userId },
      { new: true }
    );

    if (!friendship) {
      const error: any = new Error("Friend request not found");
      error.status = 404;
      throw error;
    }

    // Populate user information
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
      data: friendship
    });
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;
    
    if (!username) {
      const error: any = new Error("Username is required");
      error.status = 400;
      throw error;
    }
    
    // Find user by username
    const userToBlock = await User.findOne({ username });
    if (!userToBlock) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    const userIdToBlock = userToBlock._id;
    
    if (userId.toString() === userIdToBlock.toString()) {
      const error: any = new Error("You cannot block yourself");
      error.status = 400;
      throw error;
    }

    const friendship = await Friend.findOneAndUpdate(
      {
        $or: [
          { requester: userId, recipient: userIdToBlock },
          { requester: userIdToBlock, recipient: userId }
        ]
      },
      { status: "blocked", actionUser: userId },
      { upsert: true, new: true }
    );

    // Populate user information
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
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
    }).populate("requester recipient", "username name email");

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

export const getPendingRequests = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const received = await Friend.find({
      recipient: userId,
      status: "pending"
    }).populate("requester", "username name email");

    const sent = await Friend.find({
      requester: userId,
      status: "pending"
    }).populate("recipient", "username name email");

    res.status(200).json({
      success: true,
      message: "Pending requests retrieved successfully",
      pending: {
        received,
        sent
      }
    });
  } catch (err) {
    next(err);
  }
};

// Add a method to unfriend
export const unfriend = async (req: Req, res: Res, next: Next) => {
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
      message: "Unfriended successfully"
    });
  } catch (err) {
    next(err);
  }
};
