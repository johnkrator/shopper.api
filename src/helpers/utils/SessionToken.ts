import jwt, {Secret} from "jsonwebtoken";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

const generateToken = (res: Response, userId: string, username: string, isAdmin: boolean, roles: string[]) => {
    const secret: Secret | undefined = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret is not defined");
    }

    const token = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "7d"});

    res.cookie("jwt", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production", // Secure in production. Meaning that the cookie will only be sent over HTTPS for production.
        secure: process.env.NODE_ENV !== "test", // Secure unless in test environment. Meaning that the cookie will only be sent over HTTPS for both development and production.
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return token;
};

export default generateToken;

