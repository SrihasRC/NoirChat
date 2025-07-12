import { Req, Res, Next } from "../types/express.ts";
import Room from "../models/room.model.ts";
import Message from "../models/message.model.ts";
import { getSocketIO } from "../socket/socket.ts";

export const createRoom = async (req: Req, res: Res, next: Next) => {
    try {
        const { name, members, description, isPrivate } = req.body;
        const creatorId = req.user._id;

        if (!name) {
            const error: any = new Error("Room name is required");
            error.status = 400;
            throw error;
        }

        // Members array can be empty (creator will be added automatically)
        const membersArray = members || [];

        // Ensure the creator is included in the members (convert all to strings for comparison)
        const creatorIdStr = creatorId.toString();
        const memberStrings = membersArray.map((id: any) => id.toString());
        const membersList = [...new Set([...memberStrings, creatorIdStr])];

        const room = new Room({
            name,
            description: description || "",
            members: membersList.map(memberId => ({
                user: memberId,
                role: memberId === creatorIdStr ? "owner" : "member"
            })),
            creator: creatorId,
            admins: [creatorId],
            isPrivate: isPrivate || false
        });

        await room.save();
        await room.populate('creator', 'username email name profilePic');
        await room.populate('members.user', 'username name email profilePic');

        return res.status(201).json({ success: true, message: "Room created successfully", data: room });
    } catch (error) {
        console.error("Error in createRoom:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const joinRoom = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        if (!roomId) {
            const error: any = new Error("Room ID is required");
            error.status = 400;
            throw error;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            const error: any = new Error("Room not found");
            error.status = 404;
            throw error;
        }

        // Check if user is already a member (using the new structure)
        const existingMember = room.members.find(member => member.user.toString() === userId.toString());
        if (existingMember) {
            return res.status(200).json({ success: true, message: "Already a member of the room", data: room });
        }

        // Add user as a new member with the proper structure
        room.members.push({
            user: userId,
            role: "member",
            joinedAt: new Date()
        });
        
        await room.save();
        await room.populate('creator', 'username name email profilePic');
        await room.populate('members.user', 'username name email profilePic');

        return res.status(200).json({ success: true, message: "Joined room successfully", data: room });
    } catch (error) {
        console.error("Error in joinRoom:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const leaveRoom = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        if (!roomId) {
            const error: any = new Error("Room ID is required");
            error.status = 400;
            throw error;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            const error: any = new Error("Room not found");
            error.status = 404;
            throw error;
        }

        // Check if the user is a member of the room
        const memberIndex = room.members.findIndex(member => member.user.toString() === userId.toString());
        if (memberIndex === -1) {
            return res.status(200).json({ success: true, message: "Not a member of the room" });
        }

        // Remove the member from the array using pull
        room.members.pull({ _id: room.members[memberIndex]._id });
        await room.save();

        return res.status(200).json({ success: true, message: "Left room successfully", data: room });
    } catch (error) {
        console.error("Error in leaveRoom:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const sendRoomMessage = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId, content } = req.body;
        const userId = req.user._id;

        if (!roomId || !content) {
            const error: any = new Error("Room ID and content are required");
            error.status = 400;
            throw error;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            const error: any = new Error("Room not found");
            error.status = 404;
            throw error;
        }

        const isMember = room.members.some(member => member.user.toString() === userId.toString());
        if (!isMember) {
            const error: any = new Error("You are not a member of this room");
            error.status = 403;
            throw error;
        }

        const message = new Message({
            room: roomId,
            content,
            sender: userId
        });

        await message.save();
        await message.populate('sender', 'username name profilePic');

        // Update room's lastMessage and lastActivity
        await Room.findByIdAndUpdate(roomId, {
            lastMessage: message._id,
            lastActivity: new Date()
        });

        // Emit socket event for real-time message delivery
        const io = getSocketIO();
        if (io) {
            // Emit to the room for users currently in the room
            io.to(`room_${roomId}`).emit("new_room_message", {
                _id: message._id,
                content: message.content,
                room: message.room,
                sender: message.sender,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
            });

            // Emit room update event to all room members for unread count updates and list reordering
            const roomMembers = room.members.map(member => member.user.toString());
            roomMembers.forEach(memberId => {
                // Emit general new_message event for global listeners (like ChatLayout)
                io.to(`user_${memberId}`).emit("new_message", {
                    _id: message._id,
                    content: message.content,
                    room: message.room,
                    sender: message.sender,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt
                });
                
                // Emit room update event for unread count updates (except sender)
                if (memberId !== userId.toString()) {
                    io.to(`user_${memberId}`).emit("room_update", {
                        roomId: roomId,
                        type: "new_message"
                    });
                }
            });
        }

        return res.status(200).json({ success: true, message: "Message sent successfully", data: message });
    } catch (error) {
        console.error("Error in sendRoomMessage:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getRoomMessages = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        if (!roomId) {
            const error: any = new Error("Room ID is required");
            error.status = 400;
            throw error;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            const error: any = new Error("Room not found");
            error.status = 404;
            throw error;
        }

        // Check if the user is a member of the room using the new structure
        const isMember = room.members.some(member => member.user.toString() === userId.toString());
        if (!isMember) {
            const error: any = new Error("You are not a member of this room");
            error.status = 403;
            throw error;
        }

        const messages = await Message.find({ room: roomId }).populate("sender", "username name").sort({ createdAt: 1 });

        return res.status(200).json({ success: true, message: "Messages retrieved successfully", data: messages });
    } catch (error) {
        console.error("Error in getRoomMessages:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// Get all rooms for the authenticated user
export const getRooms = async (req: Req, res: Res, next: Next) => {
    try {
        const userId = req.user._id;

        const rooms = await Room.find({ 
            "members.user": userId 
        })
        .populate("creator", "username name email profilePic")
        .populate("members.user", "username name email profilePic")
        .sort({ lastActivity: -1 });

        // Clean up duplicate members in existing rooms (temporary fix for legacy data)
        const cleanedRooms = rooms.map(room => {
            const seenUsers = new Set();
            const uniqueMembers = room.members.filter(member => {
                const userIdStr = member.user._id.toString();
                if (seenUsers.has(userIdStr)) {
                    return false;
                }
                seenUsers.add(userIdStr);
                return true;
            });
            
            return {
                ...room.toObject(),
                members: uniqueMembers
            };
        });

        return res.status(200).json({ success: true, message: "Rooms retrieved successfully", data: cleanedRooms });
    } catch (error) {
        console.error("Error in getRooms:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateRoom = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        if (!roomId) {
            const error: any = new Error("Room ID is required");
            error.status = 400;
            throw error;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            const error: any = new Error("Room not found");
            error.status = 404;
            throw error;
        }

        if (room.creator.toString() !== userId.toString()) {
            const error: any = new Error("You are not authorized to update this room");
            error.status = 403;
            throw error;
        }

        room.name = name || room.name;
        room.description = description || room.description;

        await room.save();

        return res.status(200).json({ success: true, message: "Room updated successfully", data: room });
    } catch (error) {
        console.error("Error in updateRoom:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const deleteRoom = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        if (!roomId) {
            const error: any = new Error("Room ID is required");
            error.status = 400;
            throw error;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            const error: any = new Error("Room not found");
            error.status = 404;
            throw error;
        }

        if (room.creator.toString() !== userId.toString()) {
            const error: any = new Error("You are not authorized to delete this room");
            error.status = 403;
            throw error;
        }

        await Room.findByIdAndDelete(roomId);

        return res.status(200).json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
        console.error("Error in deleteRoom:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const searchRooms = async (req: Req, res: Res, next: Next) => {
    try {
        const { query } = req.query;
        const userId = req.user._id;

        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: "Search query must be at least 2 characters long" 
            });
        }

        // Search for public rooms that the user is not already a member of
        const rooms = await Room.find({
            $and: [
                { isPrivate: false }, // Only public rooms
                { "members.user": { $ne: userId } }, // Not already a member
                {
                    $or: [
                        { name: { $regex: query.trim(), $options: 'i' } },
                        { description: { $regex: query.trim(), $options: 'i' } }
                    ]
                }
            ]
        })
        .populate('creator', 'username name email profilePic')
        .populate('members.user', 'username name profilePic')
        .sort({ createdAt: -1 })
        .limit(20); // Limit results to prevent performance issues

        return res.status(200).json({ 
            success: true, 
            message: "Rooms search completed", 
            data: rooms 
        });
    } catch (error) {
        console.error("Error in searchRooms:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getRoomsWithUnreadCounts = async (req: Req, res: Res, next: Next) => {
    try {
        const userId = req.user._id;

        // Use aggregation to get rooms with unread counts
        const roomsWithUnreadCounts = await Room.aggregate([
            // Match rooms where user is a member
            { 
                $match: { 
                    "members.user": userId 
                } 
            },
            // Populate creator
            {
                $lookup: {
                    from: "users",
                    localField: "creator",
                    foreignField: "_id",
                    as: "creator"
                }
            },
            // Populate members
            {
                $lookup: {
                    from: "users",
                    localField: "members.user",
                    foreignField: "_id",
                    as: "memberUsers"
                }
            },
            // Get unread count for each room
            {
                $lookup: {
                    from: "messages",
                    let: { roomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$room", "$$roomId"] },
                                        { $ne: ["$sender", userId] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                }
                            }
                        },
                        { $count: "unreadCount" }
                    ],
                    as: "unreadMessages"
                }
            },
            // Transform the data
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    roomType: 1,
                    isPrivate: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    lastActivity: 1,
                    creator: { $arrayElemAt: ["$creator", 0] },
                    members: {
                        $map: {
                            input: "$members",
                            as: "member",
                            in: {
                                user: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$memberUsers",
                                                cond: { $eq: ["$$this._id", "$$member.user"] }
                                            }
                                        },
                                        0
                                    ]
                                },
                                role: "$$member.role",
                                joinedAt: "$$member.joinedAt"
                            }
                        }
                    },
                    unreadCount: {
                        $ifNull: [
                            { $arrayElemAt: ["$unreadMessages.unreadCount", 0] },
                            0
                        ]
                    }
                }
            },
            // Sort by last activity time (most recent first)
            {
                $sort: { lastActivity: -1 }
            }
        ]);

        return res.status(200).json({ 
            success: true, 
            message: "Rooms with unread counts retrieved successfully", 
            data: roomsWithUnreadCounts 
        });
    } catch (error) {
        console.error("Error in getRoomsWithUnreadCounts:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const markRoomAsRead = async (req: Req, res: Res, next: Next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        if (!roomId) {
            const error: any = new Error("Room ID is required");
            error.status = 400;
            throw error;
        }

        // Check if user is a member of the room
        const room = await Room.findOne({ 
            _id: roomId, 
            "members.user": userId 
        });

        if (!room) {
            const error: any = new Error("Room not found or user not a member");
            error.status = 404;
            throw error;
        }

        // Mark all unread messages in the room as read for this user
        const result = await Message.updateMany(
            { 
                room: roomId, 
                sender: { $ne: userId },
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
            message: "Room messages marked as read successfully", 
            data: { 
                modifiedCount: result.modifiedCount,
                roomId: roomId
            }
        });
    } catch (error) {
        console.error("Error in markRoomAsRead:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}