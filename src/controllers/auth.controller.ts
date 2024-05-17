import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt, {Secret} from "jsonwebtoken";
import asyncHandler, {ICustomRequest} from "../helpers/middlewares/asyncHandler";
import User from "../database/models/user.model";
import sendRegistrationVerificationEmail from "../helpers/emailService/sendRegistrationVerificationEmail";
import crypto from "crypto";
import sendResetPasswordEmail from "../helpers/emailService/sendResetPasswordEmail";
import {generateTokens, setTokenCookies} from "../helpers/utils/SessionToken";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

interface NextFunction {
    (err?: Error): void;
}

const createUser = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {username, email, password} = req.body;

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!username || !email || !password) {
        return res.status(400).json({message: "Please provide all the required fields"});
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message:
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
    }

    const userExists = await User.findOne({email});
    if (userExists) {
        return res.status(400).json({message: "User already exists"});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now

    // Send the verification email
    await sendRegistrationVerificationEmail(email, verificationCode);

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
        verificationCodeExpires,
    });

    try {
        await newUser.save();

        const {accessToken, refreshToken} = generateTokens(
            newUser._id,
            newUser.username,
            newUser.isAdmin,
            newUser.roles
        );

        setTokenCookies(res, accessToken, refreshToken);
        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            message: "Verification code sent to your email",
        });
    } catch (error) {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

const loginUser = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({message: "Please provide all the required fields"});
    }

    const existingUser = await User.findOne({email});
    if (existingUser) {
        if (!existingUser.isVerified) {
            return res
                .status(401)
                .json({
                    message:
                        "Email not verified. Please verify your email before logging in.",
                });
        }

        // Check if the account is locked
        const currentTime = new Date();
        if (
            existingUser.failedLoginAttempts >= 5 &&
            currentTime < existingUser.lockUntil
        ) {
            return res.status(401).json({
                message: `Account locked until ${existingUser.lockUntil}. Please try again later.`,
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (isPasswordValid) {
            // Reset failed login attempts on successful login
            existingUser.failedLoginAttempts = 0;
            existingUser.lockUntil = null;
            await existingUser.save();

            // Generate and return access and refresh tokens
            const {accessToken, refreshToken} = generateTokens(
                existingUser._id,
                existingUser.username,
                existingUser.isAdmin,
                existingUser.roles
            );

            res.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
                accessToken,
                refreshToken,
            });
        } else {
            // Increment failed login attempts and lock account if necessary
            existingUser.failedLoginAttempts += 1;
            if (existingUser.failedLoginAttempts >= 5) {
                const lockUntil = new Date(Date.now() + 60 * 1000); // 1 minute from now
                existingUser.lockUntil = lockUntil;
            }
            await existingUser.save();

            return res.status(400).json({message: "Invalid credentials"});
        }
    } else {
        return res.status(404).json({message: "User not found"});
    }
});

const changePassword = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {currentPassword, newPassword} = req.body;
    const userId = req.user?.userId;

    // Password validation regex
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!currentPassword || !newPassword) {
        return res
            .status(400)
            .json({message: "Please provide all the required fields"});
    }

    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message:
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordValid) {
        return res.status(400).json({message: "Invalid current password"});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;

    try {
        await user.save();

        res.status(200).json({message: "Password changed successfully"});
    } catch (error) {
        res.status(400);
        throw new Error("Failed to change password");
    }
});

const logoutCurrentUser = asyncHandler(async (_req: ICustomRequest, res: Response) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(0),
    });

    res.status(200).json({message: "Logged out successfully"});
});

const getAllUsers = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const startIndex: number = (page - 1) * limit;

    const totalUsers: number = await User.countDocuments({isDeleted: false});
    const users = await User.find({isDeleted: false})
        .select("-password")
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
    });
});

const getCurrentUserProfile = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const user = await User.findById(req.user?._id);

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

        const {accessToken, refreshToken} = generateTokens(
            updatedUser._id,
            updatedUser.username,
            updatedUser.isAdmin,
            updatedUser.roles
        );

        setTokenCookies(res, accessToken, refreshToken);

        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
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

const forgotPassword = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {email} = req.body;

    // Find the user by email
    const user = await User.findOne({email});

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    let resetPasswordToken, resetPasswordExpires;

    // Check if the previous reset password token has expired
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
        resetPasswordToken = crypto.randomBytes(20).toString("hex");
        resetPasswordExpires = Date.now() + 60000; // 1 minute from now
    } else {
        resetPasswordToken = user.resetPasswordToken || crypto.randomBytes(20).toString("hex");
        resetPasswordExpires = user.resetPasswordExpires || Date.now() + 60000;
    }

    // Hash the reset password token
    // Set the reset password token and expiration time
    user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;

    await user.save();

    // Send the reset password email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetPassword/${resetPasswordToken}`;
    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({message: "Reset password email sent"});
});

const resetPassword = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {resetPasswordToken, newPassword} = req.body;

    if (!resetPasswordToken) {
        return res.status(400).json({message: "Reset token is required."});
    }

    if (typeof newPassword !== "string") {
        return res.status(400).json({message: "New password is required."});
    }

    // Hash the provided reset token to compare with the stored token
    const hashedResetToken = crypto
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");

    // Find the user by hashed reset password token and check if it has not expired
    const user = await User.findOne({
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: {$gt: Date.now()},
    });

    if (!user) {
        return res
            .status(400)
            .json({message: "Invalid or expired reset token. Please request a new reset token."});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({message: "Password reset successful"});
});


const resendResetToken = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {email} = req.body;

    // Find the user by email
    const user = await User.findOne({email});

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    // Generate a new reset password token
    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpires = Date.now() + 60000; // 1 hour from now

    // Hash the reset token
    // Set the new reset password token and expiration time
    user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send the new reset password email
    const resetUrl = `${req.protocol}://${req.get(
        "host"
    )}/api/users/resetPassword/${resetPasswordToken}`;
    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({message: "New reset password email sent"});
});

const resendVerificationCode = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const {email} = req.body;

    // Find the user by email
    const user = await User.findOne({email});

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    // Generate a new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now

    // Update the user's document with the new verification code and expiration time
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send the new verification email
    await sendRegistrationVerificationEmail(email, verificationCode);

    res.status(200).json({message: "New verification code sent to your email"});
});

const handleGoogleAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, googlePhotoUrl} = req.body;

    try {
        const user = await User.findOne({email});
        if (user) {
            const token = jwt.sign(
                {id: user._id, isAdmin: user.isAdmin},
                process.env.JWT_SECRET as Secret
            );
            const {password, ...rest} = user.toObject();
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(rest);
        } else {
            const generatedPassword =
                Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8);

            const hashedPassword = await bcrypt.hash(generatedPassword, 10);
            const newUser = new User({
                username:
                    (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),

                email,
                password: hashedPassword,
                profilePicture: googlePhotoUrl,
            });
            await newUser.save();

            const token = jwt.sign(
                {
                    id: newUser._id,
                    isAdmin: newUser.isAdmin,
                },
                process.env.JWT_SECRET as Secret,
                {expiresIn: "1h"}
            );

            const {password, ...userData} = newUser.toObject();
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(userData);
        }
    } catch (error: any) {
        next(error);
    }
});

const handleFacebookAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, facebookPhotoUrl} = req.body;

    try {
        const user = await User.findOne({email});
        if (user) {
            const token = jwt.sign({id: user._id, isAdmin: user.isAdmin}, process.env.JWT_SECRET as Secret);
            const {password, ...rest} = user;
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            const hashedPassword = bcrypt.hashSync(generatedPassword, 10);
            const newUser = new User({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: facebookPhotoUrl,
            });
            await newUser.save();

            const token = jwt.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET as Secret, {expiresIn: "1h"});

            const {password, ...userData} = newUser;
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(userData);
        }
    } catch (error: any) {
        next(error);
    }
});

const handleGitHubAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, githubPhotoUrl} = req.body;

    try {
        const user = await User.findOne({email});
        if (user) {
            const token = jwt.sign({id: user._id, isAdmin: user.isAdmin}, process.env.JWT_SECRET as Secret);
            const {password, ...rest} = user;
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            const hashedPassword = bcrypt.hashSync(generatedPassword, 10);
            const newUser = new User({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: githubPhotoUrl,
            });
            await newUser.save();

            const token = jwt.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET as Secret, {expiresIn: "1h"});

            const {password, ...userData} = newUser;
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(userData);
        }
    } catch (error: any) {
        next(error);
    }
});

const handleAppleAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, applePhotoUrl} = req.body;

    try {
        const user = await User.findOne({email});
        if (user) {
            const token = jwt.sign({id: user._id, isAdmin: user.isAdmin}, process.env.JWT_SECRET as Secret);
            const {password, ...rest} = user;
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            const hashedPassword = bcrypt.hashSync(generatedPassword, 10);
            const newUser = new User({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: applePhotoUrl,
            });
            await newUser.save();

            const token = jwt.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET as Secret, {expiresIn: "1h"});

            const {password, ...userData} = newUser;
            res
                .status(200)
                .cookie("access_token", token, {
                    httpOnly: true,
                })
                .json(userData);
        }
    } catch (error: any) {
        next(error);
    }
});

export {
    createUser,
    loginUser,
    changePassword,
    logoutCurrentUser,
    getAllUsers,
    getCurrentUserProfile,
    updateCurrentUserProfile,
    deleteUserById,
    getUserById,
    updateUserById,
    assignRole,
    deleteRole,
    forgotPassword,
    resetPassword,
    resendVerificationCode,
    resendResetToken,
    handleGoogleAuth,
    handleFacebookAuth,
    handleGitHubAuth,
    handleAppleAuth
};
