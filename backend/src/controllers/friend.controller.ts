import { Req, Res, Next } from "../types/express.ts";
import Friend from "../models/friend.model.ts";
import User from "../models/user.model.ts";

export const sendFriendRequest = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }
    
    // Find the user by username
    const friendUser = await User.findOne({ username });
    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const friendId = friendUser._id;
    
    if (userId.toString() === friendId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a friend"
      });
    }

    const existing = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Friend request already exists or you're already friends"
      });
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
      friendship
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
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }
    
    // Find the requester by username
    const requesterUser = await User.findOne({ username });
    if (!requesterUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const requesterId = requesterUser._id;

    const friendship = await Friend.findOneAndUpdate(
      { requester: requesterId, recipient: userId, status: "pending" },
      { status: "accepted", actionUser: userId },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found"
      });
    }

    // Populate user information
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
      friendship
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
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }
    
    // Find the requester by username
    const requesterUser = await User.findOne({ username });
    if (!requesterUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const requesterId = requesterUser._id;

    const friendship = await Friend.findOneAndUpdate(
      { requester: requesterId, recipient: userId, status: "pending" },
      { status: "rejected", actionUser: userId },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found"
      });
    }

    // Populate user information
    await friendship.populate([
      { path: 'requester', select: 'username name email' },
      { path: 'recipient', select: 'username name email' }
    ]);

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
      friendship
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
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }
    
    // Find user by username
    const userToBlock = await User.findOne({ username });
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const userIdToBlock = userToBlock._id;
    
    if (userId.toString() === userIdToBlock.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself"
      });
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
      friendship
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
      friends
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
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }
    
    // Find the friend by username
    const friendUser = await User.findOne({ username });
    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const friendId = friendUser._id;

    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: userId, status: "accepted" }
      ]
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friendship not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Unfriended successfully"
    });
  } catch (err) {
    next(err);
  }
};
