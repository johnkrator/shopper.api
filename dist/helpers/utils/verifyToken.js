"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
const verifyToken = (0, asyncHandler_1.default)(async (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = {
            userId: decoded.userId,
            _id: decoded._id,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
        };
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Failed to authenticate token" });
    }
});
exports.default = verifyToken;
