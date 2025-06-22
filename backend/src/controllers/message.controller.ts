import { Req, Res, Next } from "../types/express.ts";
import Message from "../models/message.model.ts";
import User from "../models/user.model.ts";
import Room from "../models/room.model.ts";
import Friend from "../models/friend.model.ts";

// Send a direct message
export const sendDirectMessage = async (req: Req, res: Res, next: Next) => {
  try {
    const { receiverUsername, content, messageType = "text", fileUrl = "", fileName = "", fileSize = 0 } = req.body;
    const senderId = req.user._id;

    if (!receiverUsername || !content) {
      return res.status(400).json({
        success: false,
        message: "Receiver username and content are required"
      });
    }

    // Find receiver by username
    const receiver = await User.findOne({ username: receiverUsername });
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found"
      });
    }

    const receiverId = receiver._id;

    // Check if users are friends
    const friendship = await Friend.findOne({
      $or: [
        { requester: senderId, recipient: receiverId, status: "accepted" },
        { requester: receiverId, recipient: senderId, status: "accepted" }
      ]
    });

    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: "You can only send messages to friends"
      });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize
    });

    // Populate sender and receiver information
    await message.populate([
      { path: 'sender', select: 'username name profilePic' },
      { path: 'receiver', select: 'username name profilePic' }
    ]);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (err) {
    next(err);
  }
};

// Get conversation between two users
export const getConversation = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    // Find the other user
    const otherUser = await User.findOne({ username });
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const otherUserId = otherUser._id;

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ],
      isDeleted: false
    })
    .populate([
      { path: 'sender', select: 'username name profilePic' },
      { path: 'receiver', select: 'username name profilePic' },
      { path: 'replyTo', select: 'content sender' }
    ])
    .sort({ createdAt: -1 })
    .limit(Number(limit) * Number(page))
    .skip((Number(page) - 1) * Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: messages.length === Number(limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get all conversations for a user
export const getUserConversations = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          isDeleted: false
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$receiver",
              else: "$sender"
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUserDetails"
        }
      },
      {
        $unwind: "$otherUserDetails"
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          otherUser: {
            _id: "$otherUserDetails._id",
            username: "$otherUserDetails.username",
            name: "$otherUserDetails.name",
            profilePic: "$otherUserDetails.profilePic"
          }
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: conversations
    });
  } catch (err) {
    next(err);
  }
};

// Delete a message
export const deleteMessage = async (req: Req, res: Res, next: Next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages"
      });
    }

    // Mark as deleted instead of actually deleting
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};

// Edit a message
export const editMessage = async (req: Req, res: Res, next: Next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required"
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate([
      { path: 'sender', select: 'username name profilePic' },
      { path: 'receiver', select: 'username name profilePic' }
    ]);

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: message
    });
  } catch (err) {
    next(err);
  }
};

// Mark messages as read
export const markAsRead = async (req: Req, res: Res, next: Next) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    // Find the sender by username
    const sender = await User.findOne({ username });
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Mark all unread messages from this sender as read
    await Message.updateMany(
      { sender: sender._id, receiver: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (err) {
    next(err);
  }
};

// Search messages
export const searchMessages = async (req: Req, res: Res, next: Next) => {
  try {
    const { query = "", type = "all", page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    let searchFilter: any = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    // Filter by message type if specified
    if (type !== "all") {
      searchFilter.messageType = type;
    }

    const messages = await Message.find(searchFilter)
      .populate([
        { path: 'sender', select: 'username name profilePic' },
        { path: 'receiver', select: 'username name profilePic' },
        { path: 'room', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.status(200).json({
      success: true,
      message: "Messages search completed",
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: messages.length === Number(limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get message statistics
export const getMessageStats = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const stats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          sentMessages: {
            $sum: { $cond: [{ $eq: ["$sender", userId] }, 1, 0] }
          },
          receivedMessages: {
            $sum: { $cond: [{ $eq: ["$receiver", userId] }, 1, 0] }
          },
          unreadMessages: {
            $sum: { $cond: [
              { $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$isRead", false] }] },
              1, 0
            ]}
          },
          messagesByType: {
            $push: {
              type: "$messageType",
              count: 1
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Message statistics retrieved",
      data: stats[0] || {
        totalMessages: 0,
        sentMessages: 0,
        receivedMessages: 0,
        unreadMessages: 0,
        messagesByType: []
      }
    });
  } catch (err) {
    next(err);
  }
};
