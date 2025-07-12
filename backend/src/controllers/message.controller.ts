import Message from "../models/message.model.ts";
import { Req, Res, Next } from "../types/express.ts";
import User from "../models/user.model.ts";
import { getSocketIO } from "../socket/socket.ts";

export const sendDirectMessage = async (req: Req, res: Res, next: Next) => {
    try {
        const { receiverUsername, content, messageType, fileUrl, fileName, fileSize } = req.body;
        const senderId = req.user._id;

        if (!receiverUsername || !content) {
            const error: any = new Error("Receiver username and content are required");
            error.status = 400;
            throw error;
        }

        const receiver = await User.findOne({ username: receiverUsername });
        if (!receiver) {
            const error: any = new Error("Receiver not found");
            error.status = 404;
            throw error;
        }

        const message = new Message({
            sender: senderId,
            receiver: receiver._id,
            content,
            messageType,
            fileUrl,
            fileName,
            fileSize
        });

        await message.save();

        // Populate sender and receiver information for the response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username name')
            .populate('receiver', 'username name');

        // Emit socket event to the receiver
        const io = getSocketIO();
        if (io && populatedMessage) {
            io.to(`user_${receiver._id}`).emit("new_direct_message", populatedMessage);
            
            // Also emit conversation update to refresh the conversation list
            io.to(`user_${receiver._id}`).emit("conversation_updated", {
                otherUser: {
                    _id: senderId,
                    username: req.user.username,
                    name: req.user.name
                },
                lastMessage: {
                    _id: populatedMessage._id,
                    content: populatedMessage.content,
                    createdAt: populatedMessage.createdAt,
                    sender: {
                        _id: senderId,
                        username: req.user.username,
                        name: req.user.name
                    }
                }
            });
        }

        return res.status(201).json({ success: true, message: "Message sent successfully", data: populatedMessage });
    } catch (error) {
        console.error("Error in sendDirectMessage:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getConversation = async (req: Req, res: Res, next: Next) => {
    try {
        const { username } = req.params;
        const userId = req.user._id;

        if (!username) {
            const error: any = new Error("Username is required");
            error.status = 400;
            throw error;
        }

        const otherUser = await User.findOne({ username });
        if (!otherUser) {
            const error: any = new Error("User not found");
            error.status = 404;
            throw error;
        }

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUser._id },
                { sender: otherUser._id, receiver: userId }
            ]
        }).sort({ createdAt: 1 }).populate("sender receiver", "username name");

        // Mark messages as read
        await Message.updateMany(
            { sender: otherUser._id, receiver: userId, isRead: false },
            { $set: { isRead: true, readBy: [{ user: userId, readAt: new Date() }] } }
        );

        return res.status(200).json({ success: true, message: "Conversation retrieved successfully", data: messages });
    } catch (error) {
        console.error("Error in getConversation:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getUserConversations = async (req: Req, res: Res, next: Next) => {
    try {
        const userId = req.user._id;

        // Aggregate to get unique conversations with latest message and unread count
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiver", userId] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "otherUser"
                }
            },
            {
                $unwind: "$otherUser"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "lastMessage.sender",
                    foreignField: "_id",
                    as: "lastMessage.sender"
                }
            },
            {
                $unwind: "$lastMessage.sender"
            },
            {
                $project: {
                    otherUser: {
                        _id: "$otherUser._id",
                        username: "$otherUser.username",
                        name: "$otherUser.name",
                        isOnline: "$otherUser.isOnline",
                        lastSeen: "$otherUser.lastSeen"
                    },
                    lastMessage: {
                        _id: "$lastMessage._id",
                        content: "$lastMessage.content",
                        createdAt: "$lastMessage.createdAt",
                        sender: {
                            _id: "$lastMessage.sender._id",
                            username: "$lastMessage.sender.username",
                            name: "$lastMessage.sender.name"
                        }
                    },
                    unreadCount: 1
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            }
        ]);

        return res.status(200).json({ 
            success: true, 
            message: "Conversations retrieved successfully", 
            data: conversations 
        });
    } catch (error) {
        console.error("Error in getUserConversations:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const deleteMessage = async (req: Req, res: Res, next: Next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        if (!messageId) {
            const error: any = new Error("Message ID is required");
            error.status = 400;
            throw error;
        }

        const message = await Message.findOneAndUpdate(
            { _id: messageId, $or: [{ sender: userId }, { receiver: userId }] },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!message) {
            const error: any = new Error("Message not found or you do not have permission to delete it");
            error.status = 404;
            throw error;
        }

        return res.status(200).json({ success: true, message: "Message deleted successfully", data: message });
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const editMessage = async (req: Req, res: Res, next: Next) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!messageId || !content) {
            const error: any = new Error("Message ID and content are required");
            error.status = 400;
            throw error;
        }

        const message = await Message.findOneAndUpdate(
            { _id: messageId, sender: userId },
            {
                content,
                isEdited: true,
                editedAt: new Date()
            },
            { new: true }
        );

        if (!message) {
            const error: any = new Error("Message not found or you do not have permission to edit it");
            error.status = 404;
            throw error;
        }

        return res.status(200).json({ success: true, message: "Message edited successfully", data: message });
    } catch (error) {
        console.error("Error in editMessage:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getUnreadMessagesCount = async (req: Req, res: Res, next: Next) => {
    try {
        const userId = req.user._id;

        const unreadCount = await Message.countDocuments({
            receiver: userId,
            isRead: false
        });

        return res.status(200).json({ success: true, message: "Unread messages count retrieved successfully", data: { count: unreadCount } });
    } catch (error) {
        console.error("Error in getUnreadMessagesCount:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const markAsRead = async (req: Req, res: Res, next: Next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        if (!messageId) {
            const error: any = new Error("Message ID is required");
            error.status = 400;
            throw error;
        }

        const message = await Message.findOneAndUpdate(
            { _id: messageId, receiver: userId, isRead: false },
            {
                isRead: true,
                readBy: [{ user: userId, readAt: new Date() }]
            },
            { new: true }
        );

        if (!message) {
            const error: any = new Error("Message not found or already read");
            error.status = 404;
            throw error;
        }

        return res.status(200).json({ success: true, message: "Message marked as read successfully", data: message });
    } catch (error) {
        console.error("Error in markAsRead:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const searchMessages = async (req: Req, res: Res, next: Next) => {
    try {
        const { query } = req.query;
        const userId = req.user._id;

        if (!query) {
            const error: any = new Error("Search query is required");
            error.status = 400;
            throw error;
        }

        const messages = await Message.find({
            $or: [
                { content: { $regex: query, $options: "i" }, receiver: userId },
                { content: { $regex: query, $options: "i" }, sender: userId }
            ]
        }).sort({ createdAt: -1 }).populate("sender receiver", "username name");

        return res.status(200).json({ success: true, message: "Messages searched successfully", data: messages });
    } catch (error) {
        console.error("Error in searchMessages:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getMessageStats = async (req: Req, res: Res, next: Next) => {
    try {
        const userId = req.user._id;

        const totalMessages = await Message.countDocuments({
            $or: [{ sender: userId }, { receiver: userId }]
        });

        const unreadMessages = await Message.countDocuments({
            receiver: userId,
            isRead: false
        });

        const readMessages = await Message.countDocuments({
            receiver: userId,
            isRead: true
        });

        return res.status(200).json({
            success: true,
            message: "Message statistics retrieved successfully",
            data: {
                totalMessages,
                unreadMessages,
                readMessages
            }
        });
    } catch (error) {
        console.error("Error in getMessageStats:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const markConversationAsRead = async (req: Req, res: Res, next: Next) => {
    try {
        const { username } = req.params;
        const userId = req.user._id;

        if (!username) {
            const error: any = new Error("Username is required");
            error.status = 400;
            throw error;
        }

        // Find the other user by username
        const otherUser = await User.findOne({ username });
        if (!otherUser) {
            const error: any = new Error("User not found");
            error.status = 404;
            throw error;
        }

        // Mark all unread messages from the other user as read
        const result = await Message.updateMany(
            { 
                sender: otherUser._id, 
                receiver: userId, 
                isRead: false 
            },
            {
                $set: { 
                    isRead: true,
                    readBy: [{ user: userId, readAt: new Date() }]
                }
            }
        );

        return res.status(200).json({ 
            success: true, 
            message: "Conversation marked as read successfully", 
            data: { 
                modifiedCount: result.modifiedCount,
                conversationWith: username
            }
        });
    } catch (error) {
        console.error("Error in markConversationAsRead:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}