"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAppleAuth = exports.handleGitHubAuth = exports.handleFacebookAuth = exports.handleGoogleAuth = exports.resendVerificationCode = exports.resetPassword = exports.forgotPassword = exports.logoutCurrentUser = exports.changePassword = exports.verifyEmail = exports.loginUser = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const crypto_1 = __importDefault(require("crypto"));
const SessionToken_1 = require("../helpers/middlewares/SessionToken");
const generateOTP_1 = require("../helpers/middlewares/generateOTP");
const sendResetPasswordOTPToUserEmailAndMobile_1 = require("../helpers/smsService/sendResetPasswordOTPToUserEmailAndMobile");
const user_validation_1 = require("../helpers/utils/user.validation");
const createUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, mobileNumber } = req.body;
        yield user_validation_1.userSchema.validateAsync({ username, email, password, mobileNumber });
        const userExists = yield user_model_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const phoneNumberExists = yield user_model_1.default.findOne({ mobileNumber });
        if (phoneNumberExists) {
            return res.status(400).json({ message: "Mobile number already exists" });
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const { verificationCode, verificationCodeExpires } = yield (0, generateOTP_1.generateOTP)(email, mobileNumber);
        const newUser = new user_model_1.default({
            username,
            email,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires,
            isVerified: false,
            mobileNumber,
        });
        yield newUser.save();
        yield (0, SessionToken_1.generateToken)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            message: "Verification OTP sent to your email and mobile number",
        });
    }
    catch (error) {
        console.error("Failed to save user or send OTP:", error);
        res.status(400).json({ message: "Invalid user data or failed to send OTP" });
    }
}));
exports.createUser = createUser;
const loginUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        yield user_validation_1.loginSchema.validateAsync({ email, password });
        const existingUser = yield user_model_1.default.findOne({ email, isDeleted: false });
        if (existingUser) {
            if (existingUser.lockUntil && existingUser.lockUntil > new Date()) {
                const timeUntilUnlock = Math.ceil((existingUser.lockUntil.getTime() - Date.now()) / 1000);
                return res.status(401).json({ message: `Account locked. Please try again in ${timeUntilUnlock} seconds.` });
            }
            if (!existingUser.isVerified) {
                return res.status(401).json({ message: "Email not verified. Please verify your email before logging in." });
            }
            const isPasswordValid = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (isPasswordValid) {
                existingUser.failedLoginAttempts = 0;
                existingUser.lockUntil = null;
                yield existingUser.save();
                const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, existingUser._id, existingUser.username, existingUser.isAdmin, existingUser.roles);
                res.status(200).json({
                    _id: existingUser._id,
                    username: existingUser.username,
                    email: existingUser.email,
                    isAdmin: existingUser.isAdmin,
                    accessToken,
                    refreshToken,
                });
            }
            else {
                existingUser.failedLoginAttempts += 1;
                if (existingUser.failedLoginAttempts >= 5) {
                    existingUser.lockUntil = new Date(Date.now() + 60 * 1000);
                }
                yield existingUser.save();
                return res.status(400).json({ message: "Invalid credentials" });
            }
        }
        else {
            return res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        console.error("Failed to login user:", error);
        res.status(400).json({ message: "Invalid login credentials" });
    }
}));
exports.loginUser = loginUser;
const verifyEmail = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, verificationCode } = req.body;
    // Find the user with the provided email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Check if the verification OTP and its expiration date exist
    if (!user.verificationCode || !user.verificationCodeExpires) {
        return res.status(400).json({ message: "Verification code not found or has expired. Please request a new one" });
    }
    // Check if the verification OTP has expired
    if (user.verificationCodeExpires.getTime() < Date.now()) {
        return res.status(400).json({ message: "Verification code has expired" });
    }
    // Check if the verification OTP matches
    if (user.verificationCode === verificationCode) {
        // Update the user's document to mark the email as verified
        user.isVerified = true;
        user.verificationCode = undefined; // Remove the verification OTP after successful verification
        user.verificationCodeExpires = undefined; // Remove the verification code expiration date
        yield user.save();
        return res.status(200).json({ message: "Email verified successfully" });
    }
    else {
        return res.status(400).json({ message: "Invalid verification code" });
    }
}));
exports.verifyEmail = verifyEmail;
const changePassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { currentPassword, newPassword } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    yield user_validation_1.changePasswordSchema.validateAsync({ currentPassword, newPassword });
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid current password" });
    }
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedNewPassword = yield bcryptjs_1.default.hash(newPassword, salt);
    user.password = hashedNewPassword;
    try {
        yield user.save();
        res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        res.status(400);
        throw new Error("Failed to change password");
    }
}));
exports.changePassword = changePassword;
const logoutCurrentUser = (0, asyncHandler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("jwt", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
}));
exports.logoutCurrentUser = logoutCurrentUser;
const forgotPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, mobileNumber } = req.body;
    try {
        yield user_validation_1.forgotPasswordSchema.validateAsync({ email, mobileNumber });
    }
    catch (error) {
        return res.status(400).json({ message: "Invalid email or mobile number" });
    }
    // Find the user by email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    let resetPasswordToken, resetPasswordExpires;
    // Check if the previous reset password token has expired
    if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires) < new Date()) {
        resetPasswordToken = crypto_1.default.randomBytes(20).toString("hex");
        resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    }
    else {
        resetPasswordToken = user.resetPasswordToken;
        resetPasswordExpires = user.resetPasswordExpires;
    }
    // Hash the reset password token
    // Set the reset password token and expiration time
    user.resetPasswordToken = crypto_1.default
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;
    yield user.save();
    // Send the reset password email and SMS
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/resetPassword/${resetPasswordToken}`;
    yield (0, sendResetPasswordOTPToUserEmailAndMobile_1.sendResetPasswordOTPToUserEmailAndMobile)(user.email, mobileNumber, resetUrl);
    res.status(200).json({ message: "Reset password instructions sent to your email and mobile number" });
}));
exports.forgotPassword = forgotPassword;
const resetPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resetPasswordToken, newPassword } = req.body;
    if (!resetPasswordToken) {
        return res.status(400).json({ message: "Reset token is required." });
    }
    if (typeof newPassword !== "string") {
        return res.status(400).json({ message: "New password is required." });
    }
    // Hash the provided reset token to compare with the stored token
    const hashedResetToken = crypto_1.default
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    // Find the user by hashed reset password token and check if it has not expired
    const user = yield user_model_1.default.findOne({
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
        return res
            .status(400)
            .json({ message: "Invalid or expired reset token. Please request a new reset token." });
    }
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    yield user.save();
    res.status(200).json({ message: "Password reset successful" });
}));
exports.resetPassword = resetPassword;
const resendVerificationCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, mobileNumber } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Generate a new OTP and expiration date
        const { verificationCode, verificationCodeExpires } = yield (0, generateOTP_1.generateOTP)(email, mobileNumber);
        // Update the user's document with the new verification code and expiration time
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
        yield user.save();
        return res.json({ message: "New verification code sent to your email and mobile number" });
    }
    catch (error) {
        console.error("Failed to resend verification code:", error);
        return res.status(500).json({ message: "Failed to resend verification code" });
    }
});
exports.resendVerificationCode = resendVerificationCode;
const handleGoogleAuth = (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, googlePhotoUrl } = req.body;
    try {
        const user = yield user_model_1.default.findOne({ email });
        if (user) {
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, user._id, user.username, user.isAdmin, user.roles);
            const _b = user.toObject(), { password } = _b, rest = __rest(_b, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, rest), { accessToken, refreshToken }));
        }
        else {
            const generatedPassword = Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8);
            const hashedPassword = yield bcryptjs_1.default.hash(generatedPassword, 10);
            const newUser = new user_model_1.default({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: googlePhotoUrl,
            });
            yield newUser.save();
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            const _c = newUser.toObject(), { password } = _c, userData = __rest(_c, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, userData), { accessToken, refreshToken }));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.handleGoogleAuth = handleGoogleAuth;
const handleFacebookAuth = (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, facebookPhotoUrl } = req.body;
    try {
        let user = yield user_model_1.default.findOne({ email }).lean(); // Use .lean() to get a plain JavaScript object
        if (user) {
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, user._id, user.username, user.isAdmin, user.roles);
            const { password } = user, rest = __rest(user, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, rest), { accessToken, refreshToken }));
        }
        else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs_1.default.hashSync(generatedPassword, 10);
            const newUser = new user_model_1.default({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: facebookPhotoUrl,
            });
            yield newUser.save();
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            user = newUser.toObject(); // Convert the Mongoose document to a plain object
            const { password } = user, userData = __rest(user, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, userData), { accessToken, refreshToken }));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.handleFacebookAuth = handleFacebookAuth;
const handleGitHubAuth = (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, githubPhotoUrl } = req.body;
    try {
        let user = yield user_model_1.default.findOne({ email }).lean(); // Use .lean() to get a plain JavaScript object
        if (user) {
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, user._id, user.username, user.isAdmin, user.roles);
            const { password } = user, rest = __rest(user, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, rest), { accessToken, refreshToken }));
        }
        else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs_1.default.hashSync(generatedPassword, 10);
            const newUser = new user_model_1.default({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: githubPhotoUrl,
            });
            yield newUser.save();
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            user = newUser.toObject(); // Convert the Mongoose document to a plain object
            const { password } = user, userData = __rest(user, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, userData), { accessToken, refreshToken }));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.handleGitHubAuth = handleGitHubAuth;
const handleAppleAuth = (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, applePhotoUrl } = req.body;
    try {
        let user = yield user_model_1.default.findOne({ email }).lean(); // Use .lean() to get a plain JavaScript object
        if (user) {
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, user._id, user.username, user.isAdmin, user.roles);
            const { password } = user, rest = __rest(user, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, rest), { accessToken, refreshToken }));
        }
        else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs_1.default.hashSync(generatedPassword, 10);
            const newUser = new user_model_1.default({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: applePhotoUrl,
            });
            yield newUser.save();
            const { accessToken, refreshToken } = yield (0, SessionToken_1.generateToken)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
            user = newUser.toObject(); // Convert the Mongoose document to a plain object
            const { password } = user, userData = __rest(user, ["password"]);
            res
                .status(200)
                .json(Object.assign(Object.assign({}, userData), { accessToken, refreshToken }));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.handleAppleAuth = handleAppleAuth;
//# sourceMappingURL=auth.controller.js.map