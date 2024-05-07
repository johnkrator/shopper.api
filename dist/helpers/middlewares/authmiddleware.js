"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../../database/models/user.model"));
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        res.status(500).json({ message: error.message });
    });
};
const authenticate = asyncHandler(async (req, res, next) => {
    let token;
    token = req.cookies.jwt;
    if (token) {
        try {
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await user_model_1.default.findById(decodedToken.userId).select("-password");
            req.user = user ? user.toObject() : null;
            next();
        }
        catch (error) {
            res.status(401);
            throw new Error("Not authorized. Please login again.");
        }
    }
    else {
        res.status(403);
        throw new Error("Forbidden. Admin access only");
    }
});
exports.authenticate = authenticate;
const authorizeAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    }
    else {
        res.status(401).send("Not authorized. Admins only.");
    }
});
exports.authorizeAdmin = authorizeAdmin;
