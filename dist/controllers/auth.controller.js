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
exports.handleAppleAuth = exports.handleGitHubAuth = exports.handleFacebookAuth = exports.handleGoogleAuth = exports.resendResetToken = exports.resendVerificationCode = exports.resetPassword = exports.forgotPassword = exports.logoutCurrentUser = exports.changePassword = exports.verifyEmail = exports.loginUser = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const sendRegistrationVerificationEmail_1 = __importDefault(require("../helpers/emailService/sendRegistrationVerificationEmail"));
const crypto_1 = __importDefault(require("crypto"));
const sendResetPasswordEmail_1 = __importDefault(require("../helpers/emailService/sendResetPasswordEmail"));
const SessionToken_1 = require("../helpers/middlewares/SessionToken");
const createUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide all the required fields" });
    }
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
    }
    const userExists = yield user_model_1.default.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now
    // Send the verification email
    yield (0, sendRegistrationVerificationEmail_1.default)(email, verificationCode);
    const newUser = new user_model_1.default({
        username,
        email,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
        verificationCodeExpires,
    });
    try {
        yield newUser.save();
        (0, SessionToken_1.generateToken)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            message: "Verification code sent to your email",
        });
    }
    catch (error) {
        res.status(400);
        throw new Error("Invalid user data");
    }
}));
exports.createUser = createUser;
const loginUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const existingUser = yield user_model_1.default.findOne({ email, isDeleted: false });
    if (existingUser) {
        if (existingUser.lockUntil && existingUser.lockUntil > new Date()) {
            const timeUntilUnlock = Math.ceil((existingUser.lockUntil.getTime() - Date.now()) / 1000); // Calculate time until unlock in seconds
            return res.status(401).json({ message: `Account locked. Please try again in ${timeUntilUnlock} seconds.` });
        }
        if (!existingUser.isVerified) {
            return res.status(401).json({ message: "Email not verified. Please verify your email before logging in." });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, existingUser.password);
        if (isPasswordValid) {
            // Reset failed login attempts on successful login
            existingUser.failedLoginAttempts = 0;
            existingUser.lockUntil = null;
            const { accessToken, refreshToken } = (0, SessionToken_1.generateToken)(res, existingUser._id, existingUser.username, existingUser.isAdmin, existingUser.roles);
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
            // Increment failed login attempts and lock user after 5 attempts
            existingUser.failedLoginAttempts += 1;
            if (existingUser.failedLoginAttempts >= 5) {
                existingUser.lockUntil = new Date(Date.now() + 60 * 1000); // Lock user for 1 minute
            }
            yield existingUser.save();
            return res.status(400).json({ message: "Invalid credentials" });
        }
    }
    else {
        return res.status(404).json({ message: "User not found" });
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
    // Check if the verification code and its expiration date exist
    if (!user.verificationCode || !user.verificationCodeExpires) {
        return res.status(400).json({ message: "Verification code not found or has expired. Please request a new one" });
    }
    // Check if the verification code has expired
    if (user.verificationCodeExpires.getTime() < Date.now()) {
        return res.status(400).json({ message: "Verification code has expired" });
    }
    // Check if the verification code matches
    if (user.verificationCode === verificationCode) {
        // Update the user's document to mark the email as verified
        user.isVerified = true;
        user.verificationCode = undefined; // Remove the verification code after successful verification
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
    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!currentPassword || !newPassword) {
        return res
            .status(400)
            .json({ message: "Please provide all the required fields" });
    }
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
    }
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
    const { email } = req.body;
    // Find the user by email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    let resetPasswordToken, resetPasswordExpires;
    // Check if the previous reset password token has expired
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
        resetPasswordToken = crypto_1.default.randomBytes(20).toString("hex");
        resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    }
    else {
        resetPasswordToken = user.resetPasswordToken || crypto_1.default.randomBytes(20).toString("hex");
        resetPasswordExpires = user.resetPasswordExpires || Date.now() + 60000;
    }
    // Hash the reset password token
    // Set the reset password token and expiration time
    user.resetPasswordToken = crypto_1.default
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;
    yield user.save();
    // Send the reset password email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetPassword/${resetPasswordToken}`;
    yield (0, sendResetPasswordEmail_1.default)(user.email, resetUrl);
    res.status(200).json({ message: "Reset password email sent" });
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
const resendResetToken = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    // Find the user by email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Generate a new reset password token
    const resetPasswordToken = crypto_1.default.randomBytes(20).toString("hex");
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    // Hash the reset token
    // Set the new reset password token and expiration time
    user.resetPasswordToken = crypto_1.default
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;
    yield user.save();
    // Send the new reset password email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetPassword/${resetPasswordToken}`;
    yield (0, sendResetPasswordEmail_1.default)(user.email, resetUrl);
    res.status(200).json({ message: "New reset password email sent" });
}));
exports.resendResetToken = resendResetToken;
const resendVerificationCode = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    // Find the user by email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Generate a new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now
    // Update the user's document with the new verification code and expiration time
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    yield user.save();
    // Send the new verification email
    yield (0, sendRegistrationVerificationEmail_1.default)(email, verificationCode);
    res.status(200).json({ message: "New verification code sent to your email" });
}));
exports.resendVerificationCode = resendVerificationCode;
const handleGoogleAuth = (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, googlePhotoUrl } = req.body;
    try {
        const user = yield user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const _b = user.toObject(), { password } = _b, rest = __rest(_b, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(rest);
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
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin,
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const _c = newUser.toObject(), { password } = _c, userData = __rest(_c, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(userData);
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
        const user = yield user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password } = user, rest = __rest(user, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(rest);
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
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password } = newUser, userData = __rest(newUser, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(userData);
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
        const user = yield user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password } = user, rest = __rest(user, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(rest);
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
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password } = newUser, userData = __rest(newUser, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(userData);
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
        const user = yield user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password } = user, rest = __rest(user, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(rest);
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
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password } = newUser, userData = __rest(newUser, ["password"]);
            res
                .status(200)
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .json(userData);
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.handleAppleAuth = handleAppleAuth;
//# sourceMappingURL=auth.controller.js.map