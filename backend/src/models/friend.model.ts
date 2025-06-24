import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["accepted"],
        default: "accepted"
    }
}, { timestamps: true });

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;