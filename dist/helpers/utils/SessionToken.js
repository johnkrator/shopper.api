"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTokenCookies = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateTokens = (userId, username, isAdmin, roles) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    const accessToken = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "15m" });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
};
exports.setTokenCookies = setTokenCookies;
//# sourceMappingURL=SessionToken.js.map