"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendResetPasswordEmail = async (email, resetUrl) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: "chukwuchidieberejohn@gmail.com",
            pass: "qiiwarsjtrfhsvgc" // Be careful with sensitive information like passwords
        }
    });
    const message = {
        from: "chukwuchidieberejohn@gmail.com",
        to: email,
        subject: "Reset Password",
        text: `Click the following link to reset your password: ${resetUrl}`,
    };
    try {
        const info = await transporter.sendMail(message);
        console.log("Email sent: " + info.response);
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = sendResetPasswordEmail;
