import asyncHandler, {ICustomRequest} from "../helpers/middlewares/asyncHandler";
import User from "../database/models/user.model";
import bcrypt from "bcryptjs";
import {generateToken} from "../helpers/middlewares/SessionToken";
import mongoose from "mongoose";
import {paginate} from "../helpers/utils/paginate";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

const getAllUsers = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;

    const result = await paginate(User, {isDeleted: false}, page, limit, null, "-password");

    res.status(200).json(result);
});

const getCurrentUserProfile = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const user = await User.findOne({_id: req.user?._id, isDeleted: false});

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(404).json({
            message: "User not found",
        });
    }
});

const updateCurrentUserProfile = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const user = await User.findById(req.user?._id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        await generateToken(res, updatedUser._id, updatedUser.username, updatedUser.isAdmin, updatedUser.roles);

        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin
        });
    } else {
        res.status(404).json({message: "User not found"});
    }
});

const deleteUserById = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.params.id;
    const currentUser = req.user;

    if (currentUser?.isAdmin) {
        const user = await User.findById(userId);
        if (user) {
            if (user.isDeleted) {
                res.status(404).json({message: "User not found"});
            } else {
                user.isDeleted = true; // Set the isDeleted flag to true
                await user.save(); // Save the updated user document
                res.status(200).json({message: "User deleted"});
            }
        } else {
            res.status(404).json({message: "User not found"});
        }
    } else {
        res.status(401).json({message: "Access denied. Only admins can delete users."});
    }
});

const getUserById = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.params.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({message: "Invalid user ID"});
    }

    const user = await User
        .findOne({_id: userId, isDeleted: false})
        .select("-password");

    if (user) {
        res.json(user);
    } else {
        res.status(404).json({message: "User not found"});
    }
});

const updateUserById = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;

        // Check if isAdmin is provided in the request body and is a boolean
        if (typeof req.body.isAdmin === "boolean") {
            // Update roles array based on isAdmin value
            if (req.body.isAdmin) {
                // Add 'admin' to roles if not already present
                if (!user.roles.includes("admin")) {
                    user.roles.push("admin");
                }
            } else {
                // Remove 'admin' from roles if present
                user.roles = user.roles.filter(role => role !== "admin");
            }
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            roles: updatedUser.roles
        });
    } else {
        res.status(404).json({message: "User not found"});
    }
});

const assignRole = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {role} = req.body;
    const userId = req.params.id; // Assuming req.params.id is the ID of the user you want to assign the role to
    const isAdmin = req.user?.isAdmin; // Assuming req.user.isAdmin is set by your authorization middleware
    if (!isAdmin) {
        return res.status(403).json({message: "Access denied. Only admins can assign roles."});
    }
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(<string>role)) {
        return res.status(400).json({message: "Invalid role"});
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        if (!user.roles.includes(<string>role)) {
            user.roles.push(<string>role);
            user.isAdmin = user.roles.includes("admin"); // Update isAdmin field
            await user.save();
        }
        return res.status(200).json({message: "Role assigned successfully"});
    } catch (error) {
        console.error("Error assigning role:", error);
        return res.status(500).json({message: "Internal server error"});
    }
});

const deleteRole = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {role} = req.body;
    const userId = req.params.id; // Assuming req.params.id is the ID of the user you want to delete the role from
    const isAdmin = req.user?.isAdmin; // Assuming req.user.isAdmin is set by your authorization middleware
    if (!isAdmin) {
        return res.status(403).json({message: "Access denied. Only admins can delete roles."});
    }
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(<string>role)) {
        return res.status(400).json({message: "Invalid role"});
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        if (user.roles.includes(<string>role)) {
            user.roles = user.roles.filter((r) => r !== role);
            user.isAdmin = user.roles.includes("admin"); // Update isAdmin field
            await user.save();
        }
        res.status(200).json({message: "Role removed successfully"});
    } catch (error) {
        console.error("Error removing role:", error);
        return res.status(500).json({message: "Internal server error"});
    }
});

export {
    getAllUsers,
    getCurrentUserProfile,
    updateCurrentUserProfile,
    deleteUserById,
    getUserById,
    updateUserById,
    assignRole,
    deleteRole
};