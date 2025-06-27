import mongoose from "mongoose";
import User from "../models/user.model.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET, JWT_EXPIRATION } from "../config/env.ts";
import { Req, Res, Next } from "../types/express.ts";
import { NODE_ENV } from "../config/env.ts";

const isProduction = NODE_ENV === "production";

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
        // @ts-ignore
        const token = jwt.sign({ userId: newUser[0]._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,        
        });

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

export const signIn = async (req: Req, res: Res, next: Next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if(!user) {
            const error: any = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error: any = new Error("Invalid password");
            error.statusCode = 401;
            throw error;
        }
        
        // @ts-ignore
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,        
        });

        res.status(200).json({
            success: true,
            message: "User signed in successfully",
            data: {
                token,
                user,
            },
        });
    } catch (error) {
        next(error);
    }
}