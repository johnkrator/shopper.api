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
exports.authorizeAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../../database/models/user.model"));
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        res.status(500).json({ message: error.message });
    });
};
const authenticate = asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    token = req.cookies.jwt;
    if (token) {
        try {
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = yield user_model_1.default.findById(decodedToken.userId).select("-password");
            req.user = user ? user.toObject() : null;
            next();
        }
        catch (error) {
            res.status(401);
            next(new Error("Not authorized. Please login again."));
        }
    }
    else {
        res.status(403);
        next(new Error("Forbidden. Admin access only"));
    }
}));
exports.authenticate = authenticate;
const authorizeAdmin = asyncHandler((req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.user && req.user.isAdmin) {
        next();
    }
    else {
        next(new Error("Not authorized. Admins only."));
    }
}));
exports.authorizeAdmin = authorizeAdmin;
//# sourceMappingURL=authmiddleware.js.map