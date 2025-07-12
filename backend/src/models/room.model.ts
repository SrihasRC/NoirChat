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

// Ensure creator is added as owner and prevent duplicates
roomSchema.pre("save", function(next) {
    if (this.isNew) {
        // Check if creator is already in members array
        const creatorExists = this.members.some(member => member.user.toString() === this.creator.toString());
        
        if (!creatorExists) {
            this.members.push({
                user: this.creator,
                role: "owner"
            });
        } else {
            // If creator exists, make sure they have owner role
            const creatorMember = this.members.find(member => member.user.toString() === this.creator.toString());
            if (creatorMember) {
                creatorMember.role = "owner";
            }
        }
        
        // Ensure creator is in admins array
        if (!this.admins.includes(this.creator)) {
            this.admins.push(this.creator);
        }
    }
    next();
});

const Room = mongoose.model("Room", roomSchema);

export default Room;
