import {Request, Response, NextFunction} from "express";

export interface IUser {
    userId: string;
    _id: string;
    isAdmin: boolean;
    username: string;
}

export interface ICustomRequest extends Request {
    query: {
        page?: string;
        limit?: string;
    };
    user?: IUser;
}

const asyncHandler = (fn: (req: ICustomRequest, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        res.status(500).json({message: error.message});
    });
};

export default asyncHandler;