import nodemailer, {Transporter, SendMailOptions} from "nodemailer";

const sendRegistrationVerificationEmail = async (email: string, verificationCode: number | string): Promise<void> => {
    let transporter: Transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "chukwuchidieberejohn@gmail.com",
            pass: "qiiwarsjtrfhsvgc" // Be careful with sensitive information like passwords
        }
    });

    let message: SendMailOptions = {
        from: "chukwuchidieberejohn@gmail.com",
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
