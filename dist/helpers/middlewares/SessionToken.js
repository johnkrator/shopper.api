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
exports.refreshAccessToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = __importDefault(require("./asyncHandler"));
// Generate access and refresh tokens
const generateToken = (res, userId, username, isAdmin, roles) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    const accessToken = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "15m" }); // Access token expires in 15 minutes
    const refreshToken = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "7d" }); // Refresh token expires in 7 days
    // Store refresh token securely in the database associated with the user
    res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    return { accessToken, refreshToken };
};
exports.generateToken = generateToken;
// Implement a route to refresh the access token using the refresh token
const refreshAccessToken = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken; // Assuming the refresh token is stored in a cookie
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is missing" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, secret);
        // Logic to check if the refresh token is valid and not expired
        const accessToken = jsonwebtoken_1.default.sign({
            userId: decoded.userId,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
            roles: decoded.roles
        }, secret, { expiresIn: "15m" });
        res.cookie("jwt", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "test",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
        });
        return res.status(200).json({ accessToken });
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
}));
exports.refreshAccessToken = refreshAccessToken;
//# sourceMappingURL=SessionToken.js.map