import bcrypt from "bcryptjs";
import jwt, {Secret} from "jsonwebtoken";
import asyncHandler, {ICustomRequest} from "../helpers/middlewares/asyncHandler";
import User, {IUser} from "../database/models/user.model";
import sendRegistrationVerificationEmail from "../helpers/emailService/sendRegistrationVerificationEmail";
import crypto from "crypto";
import sendResetPasswordEmail from "../helpers/emailService/sendResetPasswordEmail";
import {generateToken} from "../helpers/middlewares/SessionToken";
import {Request} from "express";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

interface NextFunction {
    (err?: Error): void;
}

interface VerifyEmailBody {
    email: string;
    verificationCode: number;
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

        generateToken(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
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

    const existingUser = await User.findOne({email, isDeleted: false});

    if (existingUser) {
        if (existingUser.lockUntil && existingUser.lockUntil > new Date()) {
            const timeUntilUnlock = Math.ceil((existingUser.lockUntil.getTime() - Date.now()) / 1000); // Calculate time until unlock in seconds
            return res.status(401).json({message: `Account locked. Please try again in ${timeUntilUnlock} seconds.`});
        }

        if (!existingUser.isVerified) {
            return res.status(401).json({message: "Email not verified. Please verify your email before logging in."});
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);

        if (isPasswordValid) {
            // Reset failed login attempts on successful login
            existingUser.failedLoginAttempts = 0;
            existingUser.lockUntil = null;

            const {
                accessToken,
                refreshToken
            } = generateToken(res, existingUser._id, existingUser.username, existingUser.isAdmin, existingUser.roles);

            res.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
                accessToken,
                refreshToken,
            });
        } else {
            // Increment failed login attempts and lock user after 5 attempts
            existingUser.failedLoginAttempts += 1;
            if (existingUser.failedLoginAttempts >= 5) {
                existingUser.lockUntil = new Date(Date.now() + 60 * 1000); // Lock user for 1 minute
            }
            await existingUser.save();

            return res.status(400).json({message: "Invalid credentials"});
        }
    } else {
        return res.status(404).json({message: "User not found"});
    }
});

const verifyEmail = asyncHandler(async (req: Request<{}, {}, VerifyEmailBody>, res: Response) => {
    const {email, verificationCode} = req.body;

    // Find the user with the provided email
    const user: IUser | null = await User.findOne({email});

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    // Check if the verification code and its expiration date exist
    if (!user.verificationCode || !user.verificationCodeExpires) {
        return res.status(400).json({message: "Verification code not found or has expired. Please request a new one"});
    }

    // Check if the verification code has expired
    if (user.verificationCodeExpires.getTime() < Date.now()) {
        return res.status(400).json({message: "Verification code has expired"});
    }

    // Check if the verification code matches
    if (user.verificationCode === verificationCode) {
        // Update the user's document to mark the email as verified
        user.isVerified = true;
        user.verificationCode = undefined; // Remove the verification code after successful verification
        user.verificationCodeExpires = undefined; // Remove the verification code expiration date
        await user.save();

        return res.status(200).json({message: "Email verified successfully"});
    } else {
        return res.status(400).json({message: "Invalid verification code"});
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
        resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
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
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    // Hash the reset token
    // Set the new reset password token and expiration time
    user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send the new reset password email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetPassword/${resetPasswordToken}`;
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
    verifyEmail,
    changePassword,
    logoutCurrentUser,
    forgotPassword,
    resetPassword,
    resendVerificationCode,
    resendResetToken,
    handleGoogleAuth,
    handleFacebookAuth,
    handleGitHubAuth,
    handleAppleAuth
};