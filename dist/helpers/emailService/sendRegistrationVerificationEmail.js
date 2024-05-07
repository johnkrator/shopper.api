"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendRegistrationVerificationEmail = async (email, verificationCode) => {
    let transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: "chukwuchidieberejohn@gmail.com",
            pass: "qiiwarsjtrfhsvgc" // Be careful with sensitive information like passwords
        }
    });
    let message = {
        from: "chukwuchidieberejohn@gmail.com",
        to: email,
        subject: "Confirm Registration Email",
        text: `Your verification code is: ${verificationCode}`,
    };
    try {
        let info = await transporter.sendMail(message);
        console.log("Email sent: " + info.response);
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = sendRegistrationVerificationEmail;
