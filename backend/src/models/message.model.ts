import mongoose from "mongoose";
import { send } from "process";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Optional for group messages
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: false // Optional for direct messages
    },
    messageType: {
        type: String,
        enum: ["text", "image", "file", "video", "audio"],
        default: "text"
    },
    fileUrl: {
        type: String,
        default: ""
    },
    fileName: {
        type: String,
        default: ""
    },
    fileSize: {
        type: Number,
        default: 0
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1, room: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
