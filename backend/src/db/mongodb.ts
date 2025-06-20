import mongoose from "mongoose";
import { DB_URI } from "../config/env.ts";

if(!DB_URI) {
    throw new Error("DB_URI is not defined in the environment variables.");
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("Connected to MongoDB successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}

export default connectToDatabase;