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
const nodemailer_1 = __importDefault(require("nodemailer"));
const node_process_1 = __importDefault(require("node:process"));
const sendResetPasswordEmail = (email, resetUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: node_process_1.default.env.EMAIL_USERNAME,
            pass: node_process_1.default.env.EMAIL_PASSWORD
        }
    });
    const message = {
        from: node_process_1.default.env.FROM_EMAIL,
        to: email,
        subject: "Reset Password",
        text: `Click the following link to reset your password: ${resetUrl}`,
    };
    try {
        const info = yield transporter.sendMail(message);
        console.log("Email sent: " + info.response);
    }
    catch (error) {
        console.error(error);
    }
});
exports.default = sendResetPasswordEmail;
//# sourceMappingURL=sendResetPasswordEmail.js.map