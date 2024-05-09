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
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../../database/models/user.model"));
const verifyEmail = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, verificationCode } = req.body;
    // Find the user with the provided email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Check if the verification code and its expiration date exist
    if (!user.verificationCode || !user.verificationCodeExpires) {
        return res.status(400).json({ message: "Verification code not found or has expired. Please request a new one" });
    }
    // Check if the verification code has expired
    if (user.verificationCodeExpires.getTime() < Date.now()) {
        return res.status(400).json({ message: "Verification code has expired" });
    }
    // Check if the verification code matches
    if (user.verificationCode === verificationCode) {
        // Update the user's document to mark the email as verified
        user.isVerified = true;
        user.verificationCode = undefined; // Remove the verification code after successful verification
        user.verificationCodeExpires = undefined; // Remove the verification code expiration date
        yield user.save();
        return res.status(200).json({ message: "Email verified successfully" });
    }
    else {
        return res.status(400).json({ message: "Invalid verification code" });
    }
}));
exports.default = verifyEmail;
//# sourceMappingURL=verifyEmail.js.map