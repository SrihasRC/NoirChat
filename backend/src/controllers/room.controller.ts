import { Req, Res, Next } from "../types/express.ts";
import Room from "../models/room.model.ts";
import Message from "../models/message.model.ts";
import User from "../models/user.model.ts";

// Create a new room
export const createRoom = async (req: Req, res: Res, next: Next) => {
  try {
    const { name, description, isPrivate = false, maxMembers = 100 } = req.body;
    const creatorId = req.user._id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Room name is required"
      });
    }

    // Check if room name already exists
    const existingRoom = await Room.findOne({ name: name.toLowerCase() });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: "Room name already exists"
      });
    }

    const room = await Room.create({
      name: name.toLowerCase(),
      description,
      creator: creatorId,
      isPrivate,
      maxMembers,
      roomType: "group"
    });

    await room.populate([
      { path: 'creator', select: 'username name profilePic' },
      { path: 'members.user', select: 'username name profilePic' }
    ]);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room
    });
  } catch (err) {
    next(err);
  }
};

// Join a room
export const joinRoom = async (req: Req, res: Res, next: Next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is already a member
    const isMember = room.members.some(member => member.user.toString() === userId.toString());
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this room"
      });
    }

    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "Room is full"
      });
    }

    // Add user to room
    room.members.push({
      user: userId,
      role: "member"
    });

    await room.save();
    await room.populate([
      { path: 'creator', select: 'username name profilePic' },
      { path: 'members.user', select: 'username name profilePic' }
    ]);

    res.status(200).json({
      success: true,
      message: "Joined room successfully",
      data: room
    });
  } catch (err) {
    next(err);
  }
};

// Leave a room
export const leaveRoom = async (req: Req, res: Res, next: Next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is a member
    const memberIndex = room.members.findIndex(member => member.user.toString() === userId.toString());
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    // Remove user from room
    room.members.splice(memberIndex, 1);

    // If creator leaves, transfer ownership to another admin or delete room if no members
    if (room.creator.toString() === userId.toString()) {
      if (room.members.length === 0) {
        await Room.findByIdAndDelete(roomId);
        return res.status(200).json({
          success: true,
          message: "Room deleted as no members remain"
        });
      } else {
        // Transfer ownership to the first admin or first member
        const newOwner = room.members.find(member => member.role === "admin") || room.members[0];
        room.creator = newOwner.user;
        newOwner.role = "owner";
      }
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: "Left room successfully"
    });
  } catch (err) {
    next(err);
  }
};

// Send message to room
export const sendRoomMessage = async (req: Req, res: Res, next: Next) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = "text", fileUrl = "", fileName = "", fileSize = 0 } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is a member
    const isMember = room.members.some(member => member.user.toString() === senderId.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member to send messages"
      });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      room: roomId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize
    });

    // Update room's last message and activity
    room.lastMessage = message._id;
    room.lastActivity = new Date();
    await room.save();

    await message.populate([
      { path: 'sender', select: 'username name profilePic' },
      { path: 'room', select: 'name' }
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

// Get room messages
export const getRoomMessages = async (req: Req, res: Res, next: Next) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is a member
    const isMember = room.members.some(member => member.user.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member to view messages"
      });
    }

    const messages = await Message.find({
      room: roomId,
      isDeleted: false
    })
    .populate([
      { path: 'sender', select: 'username name profilePic' },
      { path: 'replyTo', select: 'content sender' }
    ])
    .sort({ createdAt: -1 })
    .limit(Number(limit) * Number(page))
    .skip((Number(page) - 1) * Number(limit));

    res.status(200).json({
      success: true,
      message: "Room messages retrieved successfully",
      data: {
        messages: messages.reverse(),
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

// Get user's rooms
export const getUserRooms = async (req: Req, res: Res, next: Next) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({
      "members.user": userId
    })
    .populate([
      { path: 'creator', select: 'username name profilePic' },
      { path: 'members.user', select: 'username name profilePic' },
      { path: 'lastMessage', select: 'content messageType createdAt' }
    ])
    .sort({ lastActivity: -1 });

    res.status(200).json({
      success: true,
      message: "User rooms retrieved successfully",
      data: rooms
    });
  } catch (err) {
    next(err);
  }
};

// Get public rooms
export const getPublicRooms = async (req: Req, res: Res, next: Next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const rooms = await Room.find({
      isPrivate: false,
      roomType: "group"
    })
    .populate([
      { path: 'creator', select: 'username name profilePic' }
    ])
    .select('name description creator members.length lastActivity')
    .sort({ lastActivity: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

    res.status(200).json({
      success: true,
      message: "Public rooms retrieved successfully",
      data: {
        rooms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: rooms.length === Number(limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update room (admin only)
export const updateRoom = async (req: Req, res: Res, next: Next) => {
  try {
    const { roomId } = req.params;
    const { name, description, isPrivate, maxMembers } = req.body;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is admin or owner
    const member = room.members.find(m => m.user.toString() === userId.toString());
    if (!member || (member.role !== "admin" && member.role !== "owner")) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update room settings"
      });
    }

    // Update room details
    if (name) room.name = name.toLowerCase();
    if (description !== undefined) room.description = description;
    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    if (maxMembers) room.maxMembers = maxMembers;

    await room.save();
    await room.populate([
      { path: 'creator', select: 'username name profilePic' },
      { path: 'members.user', select: 'username name profilePic' }
    ]);

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room
    });
  } catch (err) {
    next(err);
  }
};

// Delete room (owner only)
export const deleteRoom = async (req: Req, res: Res, next: Next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is the owner
    if (room.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the room owner can delete the room"
      });
    }

    // Delete all messages in the room
    await Message.deleteMany({ room: roomId });

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};
