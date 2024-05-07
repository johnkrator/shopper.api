import {Request, Response} from "express";
import asyncHandler from "../helpers/middlewares/asyncHandler";
import User, {IUser} from "../database/models/user.model";

interface LocationData {
    latitude: number;
    longitude: number;
}

const getCurrentLocation = asyncHandler(async (req: Request, res: Response) => {
    const {userId} = req.body;
    const {latitude, longitude} = req.body as LocationData;

    if (!latitude || !longitude || !userId) {
        return res.status(400).json({message: "Invalid data"});
    }

    try {
        const user: IUser | null = await User.findById(userId);

        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        user.location = {
            latitude,
            longitude,
        };

        await user.save();

        res.status(200).json({message: "Location saved successfully"});
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
    }
});

export {getCurrentLocation};