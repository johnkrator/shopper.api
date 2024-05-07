import {Request, Response, NextFunction} from "express";
import {isValidObjectId} from "mongoose";

const checkId = (req: Request, res: Response, next: NextFunction) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({error: "Invalid Id"});
    }
    next();
};

export default checkId;