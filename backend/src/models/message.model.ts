import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // null for group messages
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: false // null for direct messages
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    messageType: {
        type: String,
        enum: ["text", "image", "file", "voice", "video"],
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
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        emoji: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Index for better query performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
