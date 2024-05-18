import nodemailer, {Transporter, SendMailOptions} from "nodemailer";
import * as process from "node:process";

const sendRegistrationVerificationEmail = async (email: string, verificationCode: number | string): Promise<void> => {
    let transporter: Transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let message: SendMailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: "Confirm Registration Email",
        text: `Your verification code is: ${verificationCode}`,
    };

    try {
        let info = await transporter.sendMail(message);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error(error);
    }
};

export default sendRegistrationVerificationEmail;