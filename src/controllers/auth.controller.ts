import bcrypt from "bcryptjs";
import asyncHandler, {ICustomRequest} from "../helpers/middlewares/asyncHandler";
import User, {IUser} from "../database/models/user.model";
import crypto from "crypto";
import {generateToken} from "../helpers/middlewares/SessionToken";
import {Request} from "express";
import {generateOTP} from "../helpers/middlewares/generateOTP";
import {
    sendResetPasswordOTPToUserEmailAndMobile
} from "../helpers/smsService/sendResetPasswordOTPToUserEmailAndMobile";
import {changePasswordSchema, forgotPasswordSchema, loginSchema, userSchema} from "../helpers/utils/user.validation";

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
    try {
        const {username, email, password, mobileNumber} = req.body;
        await userSchema.validateAsync({username, email, password, mobileNumber});

        const userExists = await User.findOne({email});
        if (userExists) {
            return res.status(400).json({message: "User already exists"});
        }

        const phoneNumberExists = await User.findOne({mobileNumber});
        if (phoneNumberExists) {
            return res.status(400).json({message: "Mobile number already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const {verificationCode, verificationCodeExpires} = await generateOTP(email, mobileNumber);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires,
            isVerified: false,
            mobileNumber,
        });

        await newUser.save();

        await generateToken(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            message: "Verification OTP sent to your email and mobile number",
        });
    } catch (error) {
        console.error("Failed to save user or send OTP:", error);
        res.status(400).json({message: "Invalid user data or failed to send OTP"});
    }
});

const loginUser = asyncHandler(async (req: ICustomRequest, res: Response) => {
    try {
        const {email, password} = req.body;
        await loginSchema.validateAsync({email, password});

        const existingUser = await User.findOne({email, isDeleted: false});

        if (existingUser) {
            if (existingUser.lockUntil && existingUser.lockUntil > new Date()) {
                const timeUntilUnlock = Math.ceil((existingUser.lockUntil.getTime() - Date.now()) / 1000);
                return res.status(401).json({message: `Account locked. Please try again in ${timeUntilUnlock} seconds.`});
            }

            if (!existingUser.isVerified) {
                return res.status(401).json({message: "Email not verified. Please verify your email before logging in."});
            }

            const isPasswordValid = await bcrypt.compare(password, existingUser.password);

            if (isPasswordValid) {
                existingUser.failedLoginAttempts = 0;
                existingUser.lockUntil = null;
                await existingUser.save();

                const {
                    accessToken,
                    refreshToken
                } = await generateToken(res, existingUser._id, existingUser.username, existingUser.isAdmin, existingUser.roles);

                res.status(200).json({
                    _id: existingUser._id,
                    username: existingUser.username,
                    email: existingUser.email,
                    isAdmin: existingUser.isAdmin,
                    accessToken,
                    refreshToken,
                });
            } else {
                existingUser.failedLoginAttempts += 1;
                if (existingUser.failedLoginAttempts >= 5) {
                    existingUser.lockUntil = new Date(Date.now() + 60 * 1000);
                }
                await existingUser.save();

                return res.status(400).json({message: "Invalid credentials"});
            }
        } else {
            return res.status(404).json({message: "User not found"});
        }
    } catch (error) {
        console.error("Failed to login user:", error);
        res.status(400).json({message: "Invalid login credentials"});
    }
});

const verifyEmail = asyncHandler(async (req: Request<{}, {}, VerifyEmailBody>, res: Response) => {
    const {email, verificationCode} = req.body;

    // Find the user with the provided email
    const user: IUser | null = await User.findOne({email});

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    // Check if the verification OTP and its expiration date exist
    if (!user.verificationCode || !user.verificationCodeExpires) {
        return res.status(400).json({message: "Verification code not found or has expired. Please request a new one"});
    }

    // Check if the verification OTP has expired
    if (user.verificationCodeExpires.getTime() < Date.now()) {
        return res.status(400).json({message: "Verification code has expired"});
    }

    // Check if the verification OTP matches
    if (user.verificationCode === verificationCode) {
        // Update the user's document to mark the email as verified
        user.isVerified = true;
        user.verificationCode = undefined; // Remove the verification OTP after successful verification
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

    await changePasswordSchema.validateAsync({currentPassword, newPassword});

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
    const {email, mobileNumber} = req.body;

    try {
        await forgotPasswordSchema.validateAsync({email, mobileNumber});
    } catch (error) {
        return res.status(400).json({message: "Invalid email or mobile number"});
    }

    // Find the user by email
    const user = await User.findOne({email});

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    let resetPasswordToken, resetPasswordExpires;

    // Check if the previous reset password token has expired
    if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires) < new Date()) {
        resetPasswordToken = crypto.randomBytes(20).toString("hex");
        resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    } else {
        resetPasswordToken = user.resetPasswordToken;
        resetPasswordExpires = user.resetPasswordExpires;
    }

    // Hash the reset password token
    // Set the reset password token and expiration time
    user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;

    await user.save();

    // Send the reset password email and SMS
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/resetPassword/${resetPasswordToken}`;
    await sendResetPasswordOTPToUserEmailAndMobile(user.email, mobileNumber, resetUrl);

    res.status(200).json({message: "Reset password instructions sent to your email and mobile number"});
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

const resendVerificationCode = async (req: Request, res: Response) => {
    try {
        const {email, mobileNumber} = req.body;
        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        // Generate a new OTP and expiration date
        const {verificationCode, verificationCodeExpires} = await generateOTP(email, mobileNumber);

        // Update the user's document with the new verification code and expiration time
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
        await user.save();

        return res.json({message: "New verification code sent to your email and mobile number"});
    } catch (error) {
        console.error("Failed to resend verification code:", error);
        return res.status(500).json({message: "Failed to resend verification code"});
    }
};

const handleGoogleAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, googlePhotoUrl} = req.body;

    try {
        const user = await User.findOne({email});
        if (user) {
            const {
                accessToken,
                refreshToken
            } = await generateToken(res, user._id, user.username, user.isAdmin, user.roles);
            const {password, ...rest} = user.toObject();
            res
                .status(200)
                .json({...rest, accessToken, refreshToken});
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

            const {
                accessToken,
                refreshToken
            } = await generateToken(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            const {password, ...userData} = newUser.toObject();
            res
                .status(200)
                .json({...userData, accessToken, refreshToken});
        }
    } catch (error: any) {
        next(error);
    }
});

const handleFacebookAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, facebookPhotoUrl} = req.body;

    try {
        let user = await User.findOne({email}).lean(); // Use .lean() to get a plain JavaScript object
        if (user) {
            const {
                accessToken,
                refreshToken
            } = await generateToken(res, user._id, user.username, user.isAdmin, user.roles);
            const {password, ...rest} = user;
            res
                .status(200)
                .json({...rest, accessToken, refreshToken});
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

            const {
                accessToken,
                refreshToken
            } = await generateToken(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            user = newUser.toObject(); // Convert the Mongoose document to a plain object
            const {password, ...userData} = user;
            res
                .status(200)
                .json({...userData, accessToken, refreshToken});
        }
    } catch (error: any) {
        next(error);
    }
});

const handleGitHubAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, githubPhotoUrl} = req.body;

    try {
        let user = await User.findOne({email}).lean(); // Use .lean() to get a plain JavaScript object
        if (user) {
            const {
                accessToken,
                refreshToken
            } = await generateToken(res, user._id, user.username, user.isAdmin, user.roles);
            const {password, ...rest} = user;
            res
                .status(200)
                .json({...rest, accessToken, refreshToken});
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

            const {
                accessToken,
                refreshToken
            } = await generateToken(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            user = newUser.toObject(); // Convert the Mongoose document to a plain object
            const {password, ...userData} = user;
            res
                .status(200)
                .json({...userData, accessToken, refreshToken});
        }
    } catch (error: any) {
        next(error);
    }
});

const handleAppleAuth = asyncHandler(async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const {email, name, applePhotoUrl} = req.body;

    try {
        let user = await User.findOne({email}).lean(); // Use .lean() to get a plain JavaScript object
        if (user) {
            const {
                accessToken,
                refreshToken
            } = await generateToken(res, user._id, user.username, user.isAdmin, user.roles);
            const {password, ...rest} = user;
            res
                .status(200)
                .json({...rest, accessToken, refreshToken});
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

            const {
                accessToken,
                refreshToken
            } = await generateToken(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            user = newUser.toObject(); // Convert the Mongoose document to a plain object
            const {password, ...userData} = user;
            res
                .status(200)
                .json({...userData, accessToken, refreshToken});
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
    handleGoogleAuth,
    handleFacebookAuth,
    handleGitHubAuth,
    handleAppleAuth
};