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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = void 0;
const sendRegistrationOTPToUserEmailAndMobile_1 = require("../smsService/sendRegistrationOTPToUserEmailAndMobile");
const generateOTP = (email, mobileNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    try {
        // Send the verification OTP
        yield (0, sendRegistrationOTPToUserEmailAndMobile_1.sendRegistrationOTPToUserEmailAndMobile)(email, mobileNumber, verificationCode.toString());
        return { verificationCode, verificationCodeExpires };
    }
    catch (error) {
        console.error("Failed to send OTP:", error);
        throw new Error("Failed to send OTP");
    }
});
exports.generateOTP = generateOTP;
//# sourceMappingURL=generateOTP.js.map