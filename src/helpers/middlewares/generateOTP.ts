import {sendRegistrationOTPToUserEmailAndMobile} from "../smsService/sendRegistrationOTPToUserEmailAndMobile";

export const generateOTP = async (email: string, mobileNumber: string) => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    try {
        // Send the verification OTP
        await sendRegistrationOTPToUserEmailAndMobile(email, mobileNumber, verificationCode.toString());

        return {verificationCode, verificationCodeExpires};
    } catch (error) {
        console.error("Failed to send OTP:", error);
        throw new Error("Failed to send OTP");
    }
};