"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAppleAuth = exports.handleGitHubAuth = exports.handleFacebookAuth = exports.handleGoogleAuth = exports.resendResetToken = exports.resendVerificationCode = exports.resetPassword = exports.forgotPassword = exports.deleteRole = exports.assignRole = exports.updateUserById = exports.getUserById = exports.deleteUserById = exports.updateCurrentUserProfile = exports.getCurrentUserProfile = exports.getAllUsers = exports.logoutCurrentUser = exports.changePassword = exports.loginUser = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const sendRegistrationVerificationEmail_1 = __importDefault(require("../helpers/emailService/sendRegistrationVerificationEmail"));
const crypto_1 = __importDefault(require("crypto"));
const sendResetPasswordEmail_1 = __importDefault(require("../helpers/emailService/sendResetPasswordEmail"));
const SessionToken_1 = __importDefault(require("../helpers/utils/SessionToken"));
const createUser = (0, asyncHandler_1.default)(async (req, res) => {
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
    const userExists = await user_model_1.default.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now
    // Send the verification email
    await (0, sendRegistrationVerificationEmail_1.default)(email, verificationCode);
    const newUser = new user_model_1.default({
        username,
        email,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
        verificationCodeExpires,
    });
    try {
        await newUser.save();
        (0, SessionToken_1.default)(res, newUser._id, newUser.username, newUser.isAdmin, newUser.roles);
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
});
exports.createUser = createUser;
const loginUser = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Please provide all the required fields" });
    }
    const existingUser = await user_model_1.default.findOne({ email });
    if (existingUser) {
        if (!existingUser.isVerified) {
            return res
                .status(401)
                .json({
                message: "Email not verified. Please verify your email before logging in.",
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, existingUser.password);
        if (isPasswordValid) {
            (0, SessionToken_1.default)(res, existingUser._id, existingUser.username, existingUser.isAdmin, existingUser.roles);
            res.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
            });
        }
        else {
            return res.status(400).json({ message: "Invalid credentials" });
        }
    }
    else {
        return res.status(404).json({ message: "User not found" });
    }
});
exports.loginUser = loginUser;
const changePassword = (0, asyncHandler_1.default)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;
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
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid current password" });
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, salt);
    user.password = hashedNewPassword;
    try {
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        res.status(400);
        throw new Error("Failed to change password");
    }
});
exports.changePassword = changePassword;
const logoutCurrentUser = (0, asyncHandler_1.default)(async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
});
exports.logoutCurrentUser = logoutCurrentUser;
const getAllUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const totalUsers = await user_model_1.default.countDocuments({ isDeleted: false });
    const users = await user_model_1.default.find({ isDeleted: false })
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
exports.getAllUsers = getAllUsers;
const getCurrentUserProfile = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await user_model_1.default.findById(req.user?._id);
    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
        });
    }
    else {
        res.status(404).json({
            message: "User not found",
        });
    }
});
exports.getCurrentUserProfile = getCurrentUserProfile;
const updateCurrentUserProfile = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await user_model_1.default.findById(req.user?._id);
    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            user.password = await bcryptjs_1.default.hash(req.body.password, salt);
        }
        const updatedUser = await user.save();
        (0, SessionToken_1.default)(res, updatedUser._id, updatedUser.username, updatedUser.isAdmin, updatedUser.roles);
        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
});
exports.updateCurrentUserProfile = updateCurrentUserProfile;
const deleteUserById = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.params.id;
    const currentUser = req.user;
    if (currentUser?.isAdmin) {
        const user = await user_model_1.default.findById(userId);
        if (user) {
            if (user.isDeleted) {
                res.status(404).json({ message: "User not found" });
            }
            else {
                user.isDeleted = true; // Set the isDeleted flag to true
                await user.save(); // Save the updated user document
                res.status(200).json({ message: "User deleted" });
            }
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    else {
        res.status(401).json({ message: "Access denied. Only admins can delete users." });
    }
});
exports.deleteUserById = deleteUserById;
const getUserById = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.params.id;
    if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await user_model_1.default
        .findOne({ _id: userId, isDeleted: false })
        .select("-password");
    if (user) {
        res.json(user);
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
});
exports.getUserById = getUserById;
const updateUserById = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await user_model_1.default.findById(req.params.id);
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
            }
            else {
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
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
});
exports.updateUserById = updateUserById;
const assignRole = (0, asyncHandler_1.default)(async (req, res) => {
    const { role } = req.body;
    const userId = req.params.id; // Assuming req.params.id is the ID of the user you want to assign the role to
    const isAdmin = req.user?.isAdmin; // Assuming req.user.isAdmin is set by your authorization middleware
    if (!isAdmin) {
        return res.status(403).json({ message: "Access denied. Only admins can assign roles." });
    }
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.roles.includes(role)) {
            user.roles.push(role);
            user.isAdmin = user.roles.includes("admin"); // Update isAdmin field
            await user.save();
        }
        return res.status(200).json({ message: "Role assigned successfully" });
    }
    catch (error) {
        console.error("Error assigning role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.assignRole = assignRole;
const deleteRole = (0, asyncHandler_1.default)(async (req, res) => {
    const { role } = req.body;
    const userId = req.params.id; // Assuming req.params.id is the ID of the user you want to delete the role from
    const isAdmin = req.user?.isAdmin; // Assuming req.user.isAdmin is set by your authorization middleware
    if (!isAdmin) {
        return res.status(403).json({ message: "Access denied. Only admins can delete roles." });
    }
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.roles.includes(role)) {
            user.roles = user.roles.filter((r) => r !== role);
            user.isAdmin = user.roles.includes("admin"); // Update isAdmin field
            await user.save();
        }
        res.status(200).json({ message: "Role removed successfully" });
    }
    catch (error) {
        console.error("Error removing role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteRole = deleteRole;
const forgotPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const { email } = req.body;
    // Find the user by email
    const user = await user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    let resetPasswordToken, resetPasswordExpires;
    // Check if the previous reset password token has expired
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
        resetPasswordToken = crypto_1.default.randomBytes(20).toString("hex");
        resetPasswordExpires = Date.now() + 60000; // 1 minute from now
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
    await user.save();
    // Send the reset password email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetPassword/${resetPasswordToken}`;
    await (0, sendResetPasswordEmail_1.default)(user.email, resetUrl);
    res.status(200).json({ message: "Reset password email sent" });
});
exports.forgotPassword = forgotPassword;
const resetPassword = (0, asyncHandler_1.default)(async (req, res) => {
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
    const user = await user_model_1.default.findOne({
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
        return res
            .status(400)
            .json({ message: "Invalid or expired reset token. Please request a new reset token." });
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
});
exports.resetPassword = resetPassword;
const resendResetToken = (0, asyncHandler_1.default)(async (req, res) => {
    const { email } = req.body;
    // Find the user by email
    const user = await user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Generate a new reset password token
    const resetPasswordToken = crypto_1.default.randomBytes(20).toString("hex");
    const resetPasswordExpires = Date.now() + 60000; // 1 hour from now
    // Hash the reset token
    // Set the new reset password token and expiration time
    user.resetPasswordToken = crypto_1.default
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();
    // Send the new reset password email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetPassword/${resetPasswordToken}`;
    await (0, sendResetPasswordEmail_1.default)(user.email, resetUrl);
    res.status(200).json({ message: "New reset password email sent" });
});
exports.resendResetToken = resendResetToken;
const resendVerificationCode = (0, asyncHandler_1.default)(async (req, res) => {
    const { email } = req.body;
    // Find the user by email
    const user = await user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Generate a new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now
    // Update the user's document with the new verification code and expiration time
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();
    // Send the new verification email
    await (0, sendRegistrationVerificationEmail_1.default)(email, verificationCode);
    res.status(200).json({ message: "New verification code sent to your email" });
});
exports.resendVerificationCode = resendVerificationCode;
const handleGoogleAuth = (0, asyncHandler_1.default)(async (req, res, next) => {
    const { email, name, googlePhotoUrl } = req.body;
    try {
        const user = await user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = user.toObject();
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
            const hashedPassword = await bcryptjs_1.default.hash(generatedPassword, 10);
            const newUser = new user_model_1.default({
                username: (name ? name.toLowerCase().split(" ").join("") : "") +
                    Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: googlePhotoUrl,
            });
            await newUser.save();
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin,
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password, ...userData } = newUser.toObject();
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
});
exports.handleGoogleAuth = handleGoogleAuth;
const handleFacebookAuth = (0, asyncHandler_1.default)(async (req, res, next) => {
    const { email, name, facebookPhotoUrl } = req.body;
    try {
        const user = await user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = user;
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
            await newUser.save();
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password, ...userData } = newUser;
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
});
exports.handleFacebookAuth = handleFacebookAuth;
const handleGitHubAuth = (0, asyncHandler_1.default)(async (req, res, next) => {
    const { email, name, githubPhotoUrl } = req.body;
    try {
        const user = await user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = user;
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
            await newUser.save();
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password, ...userData } = newUser;
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
});
exports.handleGitHubAuth = handleGitHubAuth;
const handleAppleAuth = (0, asyncHandler_1.default)(async (req, res, next) => {
    const { email, name, applePhotoUrl } = req.body;
    try {
        const user = await user_model_1.default.findOne({ email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = user;
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
            await newUser.save();
            const token = jsonwebtoken_1.default.sign({
                id: newUser._id,
                isAdmin: newUser.isAdmin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password, ...userData } = newUser;
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
});
exports.handleAppleAuth = handleAppleAuth;
