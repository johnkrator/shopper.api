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
const sendRegistrationVerificationEmail = (email, verificationCode) => __awaiter(void 0, void 0, void 0, function* () {
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
        let info = yield transporter.sendMail(message);
        console.log("Email sent: " + info.response);
    }
    catch (error) {
        console.error(error);
    }
});
exports.default = sendRegistrationVerificationEmail;
//# sourceMappingURL=sendRegistrationVerificationEmail.js.map