import { JWT_SECRET } from "../config/env";
import { Req, Res, Next } from "../types/express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

const authMiddleware = async (req: Req, res: Res, next: Next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({message: "Authentication token is missing"});
        }
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({message: "User not found"});
        }

        req.user = user;
        next();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(401).json({message: "Authentication failed", error: errorMessage});
    }
}

export default authMiddleware;