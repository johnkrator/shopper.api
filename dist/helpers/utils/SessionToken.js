"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (res, userId, username, isAdmin, roles) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    const token = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "7d" });
    res.cookie("jwt", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production", // Secure in production. Meaning that the cookie will only be sent over HTTPS for production.
        secure: process.env.NODE_ENV !== "test", // Secure unless in test environment. Meaning that the cookie will only be sent over HTTPS for both development and production.
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    return token;
};
exports.default = generateToken;
