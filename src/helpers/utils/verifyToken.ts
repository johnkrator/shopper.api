import jwt, {Secret, JwtPayload} from "jsonwebtoken";
import {Response, NextFunction} from "express";
import asyncHandler, {ICustomRequest, IUser} from "../middlewares/asyncHandler";

const verifyToken = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({message: "No token provided"});
    }

    try {
        const decoded: JwtPayload = jwt.verify(token, process.env.JWT_SECRET as Secret) as JwtPayload;
        const user: IUser = {
            userId: decoded.userId,
            _id: decoded._id,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
        };
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({message: "Failed to authenticate token"});
    }
});

export default verifyToken;
