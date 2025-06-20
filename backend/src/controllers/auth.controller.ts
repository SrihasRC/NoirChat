import mongoose from "mongoose";
import User from "../models/user.model.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET, JWT_EXPIRATION } from "../config/env.ts";
import { Req, Res, Next } from "../types/express.ts";

export const signUp = async (req: Req, res: Res, next: Next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { username, name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error: any = new Error("User already exists");
            error.statusCode = 409;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create([{name, username, email, password: hashedPassword}], { session });
        const token = jwt.sign({ userId: newUser[0]._id }, JWT_SECRET, { expiresIn: parseInt(JWT_EXPIRATION as string, 10) });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                token,
                user: newUser[0],
            },
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}