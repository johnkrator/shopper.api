import nodemailer, {Transporter, SendMailOptions} from "nodemailer";

const sendResetPasswordEmail = async (email: string, resetUrl: string): Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "chukwuchidieberejohn@gmail.com",
            pass: "qiiwarsjtrfhsvgc" // Be careful with sensitive information like passwords
        }
    });

    const message: SendMailOptions = {
        from: "chukwuchidieberejohn@gmail.com",
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
