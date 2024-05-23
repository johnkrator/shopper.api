import jwt, {Secret} from "jsonwebtoken";
import User from "../../database/models/user.model";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

// Generate access and refresh tokens
const generateToken = async (res: Response, userId: string, username: string, isAdmin: boolean, roles: string[]) => {
    const secret: Secret | undefined = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret is not defined");
    }

    const accessToken = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "1d"}); // Access token expires in 1 day
    const refreshToken = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "7d"}); // Refresh token expires in 7 days

    // Store refresh token securely in the database associated with the user
    try {
        await User.findByIdAndUpdate(userId, {refreshToken});
    } catch (error) {
        console.error("Error storing refresh token:", error);
    }

    res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    return {accessToken, refreshToken};
};

export {generateToken};