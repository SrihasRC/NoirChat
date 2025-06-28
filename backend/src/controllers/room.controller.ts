import { Req, Res, Next } from "../types/express.ts";
import Room from "../models/room.model.ts";
import Message from "../models/message.model.ts";

export const createRoom = async (req: Req, res: Res, next: Next) => {
    try {
        const { name, members, description, isPrivate } = req.body;
        const creatorId = req.user._id;

        if (!name || !members || members.length === 0) {
            const error: any = new Error("Room name and members are required");
            error.status = 400;
            throw error;
        }

        // Ensure the creator is included in the members
        const membersList = [...new Set([...members, creatorId.toString()])];

        const room = new Room({
            name,
            description: description || "",
            members: membersList.map(memberId => ({
                user: memberId,
                role: memberId === creatorId.toString() ? "owner" : "member"
            })),
            creator: creatorId,
            admins: [creatorId],
            isPrivate: isPrivate || false
        });

        await room.save();
        await room.populate('creator', 'username email name profilePic');

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

        if (!room.members.includes(userId.toString())) {
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

        if (!room.members.includes(userId.toString())) {
            const error: any = new Error("You are not a member of this room");
            error.status = 403;
            throw error;
        }

        const messages = await Message.find({ room: roomId }).populate("sender", "username name").sort({ createdAt: -1 });

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
        }).populate("creator", "username name email profilePic").sort({ createdAt: -1 });

        return res.status(200).json({ success: true, message: "Rooms retrieved successfully", data: rooms });
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