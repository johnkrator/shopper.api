import {Request, Response, NextFunction} from "express";
import jwt, {Secret} from "jsonwebtoken";
import User, {IUser} from "../../database/models/user.model";
import {Document} from "mongoose";

interface AuthenticatedRequest extends Request {
    user?: (IUser & Document<any, any, IUser>) | null;
}

const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        res.status(500).json({message: error.message});
    });
};

const authenticate = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token;

    token = req.cookies.jwt;

    if (token) {
        try {
            const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET as Secret);
            const user = await User.findById(decodedToken.userId).select("-password");
            req.user = user ? user.toObject() : null;
            next();
        } catch (error) {
            res.status(401);
            next(new Error("Not authorized. Please login again."));
        }
    } else {
        res.status(403);
        next(new Error("Forbidden. Admin access only"));
    }
});

const authorizeAdmin = asyncHandler(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        next(new Error("Not authorized. Admins only."));
    }
});

export {authenticate, authorizeAdmin};
