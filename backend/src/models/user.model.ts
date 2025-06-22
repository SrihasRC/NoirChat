import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        lowercase: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [20, "Username must be at most 20 characters long"],
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric"],
    },
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format"]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    profilePic: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        maxlength: 100,
        default: "Hey there! I'm using NoirChat"
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    preferences: {
        theme: {
            type: String,
            enum: ["light", "dark", "system"],
            default: "system"
        },
        notifications: {
            type: Boolean,
            default: true
        },
        readReceipts: {
            type: Boolean,
            default: true
        },
        typingIndicators: {
            type: Boolean,
            default: true
        }
    }      
}, {timestamps: true});

userSchema.pre("save", function (next) {
    if (!this.profilePic?.trim()) {
        this.profilePic = `https://ui-avatars.com/api/?name=${this.username}&background=random&color=fff&rounded=true&bold=true`;
    }
    next();
});

const User = mongoose.model("User", userSchema);

export default User;