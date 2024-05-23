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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.assignRole = exports.updateUserById = exports.getUserById = exports.deleteUserById = exports.updateCurrentUserProfile = exports.getCurrentUserProfile = exports.getAllUsers = void 0;
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SessionToken_1 = require("../helpers/middlewares/SessionToken");
const mongoose_1 = __importDefault(require("mongoose"));
const paginate_1 = require("../helpers/utils/paginate");
const getAllUsers = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = yield (0, paginate_1.paginate)(user_model_1.default, { isDeleted: false }, page, limit, null, "-password");
    res.status(200).json(result);
}));
exports.getAllUsers = getAllUsers;
const getCurrentUserProfile = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.default.findOne({ _id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, isDeleted: false });
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
}));
exports.getCurrentUserProfile = getCurrentUserProfile;
const updateCurrentUserProfile = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const user = yield user_model_1.default.findById((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            const salt = yield bcryptjs_1.default.genSalt(10);
            user.password = yield bcryptjs_1.default.hash(req.body.password, salt);
        }
        const updatedUser = yield user.save();
        (0, SessionToken_1.generateToken)(res, updatedUser._id, updatedUser.username, updatedUser.isAdmin, updatedUser.roles);
        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin
        });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
}));
exports.updateCurrentUserProfile = updateCurrentUserProfile;
const deleteUserById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const currentUser = req.user;
    if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.isAdmin) {
        const user = yield user_model_1.default.findById(userId);
        if (user) {
            if (user.isDeleted) {
                res.status(404).json({ message: "User not found" });
            }
            else {
                user.isDeleted = true; // Set the isDeleted flag to true
                yield user.save(); // Save the updated user document
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
}));
exports.deleteUserById = deleteUserById;
const getUserById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = yield user_model_1.default
        .findOne({ _id: userId, isDeleted: false })
        .select("-password");
    if (user) {
        res.json(user);
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
}));
exports.getUserById = getUserById;
const updateUserById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.params.id);
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
        const updatedUser = yield user.save();
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
}));
exports.updateUserById = updateUserById;
const assignRole = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { role } = req.body;
    const userId = req.params.id; // Assuming req.params.id is the ID of the user you want to assign the role to
    const isAdmin = (_c = req.user) === null || _c === void 0 ? void 0 : _c.isAdmin; // Assuming req.user.isAdmin is set by your authorization middleware
    if (!isAdmin) {
        return res.status(403).json({ message: "Access denied. Only admins can assign roles." });
    }
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.roles.includes(role)) {
            user.roles.push(role);
            user.isAdmin = user.roles.includes("admin"); // Update isAdmin field
            yield user.save();
        }
        return res.status(200).json({ message: "Role assigned successfully" });
    }
    catch (error) {
        console.error("Error assigning role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
exports.assignRole = assignRole;
const deleteRole = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { role } = req.body;
    const userId = req.params.id; // Assuming req.params.id is the ID of the user you want to delete the role from
    const isAdmin = (_d = req.user) === null || _d === void 0 ? void 0 : _d.isAdmin; // Assuming req.user.isAdmin is set by your authorization middleware
    if (!isAdmin) {
        return res.status(403).json({ message: "Access denied. Only admins can delete roles." });
    }
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.roles.includes(role)) {
            user.roles = user.roles.filter((r) => r !== role);
            user.isAdmin = user.roles.includes("admin"); // Update isAdmin field
            yield user.save();
        }
        res.status(200).json({ message: "Role removed successfully" });
    }
    catch (error) {
        console.error("Error removing role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
exports.deleteRole = deleteRole;
//# sourceMappingURL=user.controller.js.map