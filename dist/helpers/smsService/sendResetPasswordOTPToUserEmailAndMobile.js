"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.sendResetPasswordOTPToUserEmailAndMobile = void 0;
const process = __importStar(require("node:process"));
const twilio_1 = require("twilio");
const google_libphonenumber_1 = require("google-libphonenumber");
const sendResetPasswordEmail_1 = __importDefault(require("../emailService/sendResetPasswordEmail"));
const phoneUtil = google_libphonenumber_1.PhoneNumberUtil.getInstance();
const sendResetPasswordOTPToUserEmailAndMobile = (email, mobileNumber, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Send OTP to email
        yield (0, sendResetPasswordEmail_1.default)(email, otp);
        // Send OTP to mobile number using Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;
        if (!accountSid || !authToken) {
            console.error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables must be set");
            return;
        }
        if (!fromNumber) {
            console.error("TWILIO_FROM_NUMBER environment variable is not set");
            return;
        }
        const client = new twilio_1.Twilio(accountSid, authToken);
        // Format the mobile number using google-libphonenumber
        const formattedMobileNumber = phoneUtil.format(phoneUtil.parseAndKeepRawInput(mobileNumber, "US"), google_libphonenumber_1.PhoneNumberFormat.E164);
        // Define a title-like heading for the SMS message
        const smsMessage = `Reset your password by following this link: ${otp}`;
        yield client.messages.create({
            body: smsMessage,
            from: fromNumber,
            to: formattedMobileNumber,
        });
    }
    catch (error) {
        console.error(error);
    }
});
exports.sendResetPasswordOTPToUserEmailAndMobile = sendResetPasswordOTPToUserEmailAndMobile;
//# sourceMappingURL=sendResetPasswordOTPToUserEmailAndMobile.js.map