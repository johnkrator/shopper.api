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
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../../database/models/user.model"));
// Generate access and refresh tokens
const generateToken = (res, userId, username, isAdmin, roles) => __awaiter(void 0, void 0, void 0, function* () {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    const accessToken = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "1d" }); // Access token expires in 1 day
    const refreshToken = jsonwebtoken_1.default.sign({ userId, username, isAdmin, roles }, secret, { expiresIn: "7d" }); // Refresh token expires in 7 days
    // Store refresh token securely in the database associated with the user
    try {
        yield user_model_1.default.findByIdAndUpdate(userId, { refreshToken });
    }
    catch (error) {
        console.error("Error storing refresh token:", error);
    }
    res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });
    return { accessToken, refreshToken };
});
exports.generateToken = generateToken;
//# sourceMappingURL=SessionToken.js.map