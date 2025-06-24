import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 50,
        trim: true
    },
    description: {
        type: String,
        maxlength: 200,
        default: ""
    },
    roomType: {
        type: String,
        enum: ["direct", "group", "public"],
        default: "group"
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        role: {
            type: String,
            enum: ["member", "admin", "owner"],
            default: "member"
        }
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    maxMembers: {
        type: Number,
        default: 100
    },
    roomImage: {
        type: String,
        default: ""
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure creator is added as owner
roomSchema.pre("save", function(next) {
    if (this.isNew) {
        this.members.push({
            user: this.creator,
            role: "owner"
        });
        this.admins.push(this.creator);
    }
    next();
});

const Room = mongoose.model("Room", roomSchema);

export default Room;
