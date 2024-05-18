import nodemailer, {Transporter, SendMailOptions} from "nodemailer";
import process from "node:process";

const sendResetPasswordEmail = async (email: string, resetUrl: string): Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const message: SendMailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: "Reset Password",
        text: `Click the following link to reset your password: ${resetUrl}`,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error(error);
    }
};

export default sendResetPasswordEmail;