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
    const token = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "30d" });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return token;
};
exports.default = generateToken;
