import Message from "../models/message.model";
import Room from "../models/room.model";
import { Req, Res, Next } from "../types/express";
import User from "../models/user.model";

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

        return res.status(201).json({ success: true, message: "Message sent successfully", data: message });
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
        }).sort({ createdAt: -1 }).populate("sender receiver", "username name");

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

        const conversations = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).sort({ createdAt: -1 }).populate("sender receiver", "username name");

        if (!conversations || conversations.length === 0) {
            return res.status(404).json({ success: false, message: "No conversations found" });
        }

        return res.status(200).json({ success: true, message: "Conversations retrieved successfully", data: conversations });
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