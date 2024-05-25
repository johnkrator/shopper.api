import * as process from "node:process";
import {Twilio} from "twilio";
import sendRegistrationVerificationEmail from "../emailService/sendRegistrationVerificationEmail";
import {PhoneNumberUtil, PhoneNumberFormat} from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

const sendRegistrationOTPToUserEmailAndMobile = async (email: string, mobileNumber: string, otp: string): Promise<void> => {
    try {
        // Send OTP to email
        await sendRegistrationVerificationEmail(email, otp);

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

        const client = new Twilio(accountSid, authToken);

        // Format the mobile number using google-libphonenumber
        const formattedMobileNumber = phoneUtil.format(phoneUtil.parseAndKeepRawInput(mobileNumber, "US"), PhoneNumberFormat.E164);

        // Define a title-like heading for the SMS message
        const smsTitle = "Verification Code";

        await client.messages.create({
            body: `${smsTitle}\nYour OTP is: ${otp}`,
            from: fromNumber,
            to: formattedMobileNumber,
        });
    } catch (error) {
        console.error(error);
    }
};

export {sendRegistrationOTPToUserEmailAndMobile};