import jwt, {Secret} from "jsonwebtoken";
import asyncHandler, {ICustomRequest} from "./asyncHandler";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

// Generate access and refresh tokens
const generateToken = (res: Response, userId: string, username: string, isAdmin: boolean, roles: string[]) => {
    const secret: Secret | undefined = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret is not defined");
    }

    const accessToken = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "15m"}); // Access token expires in 15 minutes
    const refreshToken = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "7d"}); // Refresh token expires in 7 days

    // Store refresh token securely in the database associated with the user

    res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    return {accessToken, refreshToken};
};

// Implement a route to refresh the access token using the refresh token
const refreshAccessToken = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const refreshToken = req.cookies.refreshToken; // Assuming the refresh token is stored in a cookie

    if (!refreshToken) {
        return res.status(401).json({message: "Refresh token is missing"});
    }

    const secret: Secret | undefined = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret is not defined");
    }

    try {
        const decoded = jwt.verify(refreshToken, secret) as {
            userId: string;
            username: string;
            isAdmin: boolean;
            roles: string[]
        };

        // Logic to check if the refresh token is valid and not expired
        const accessToken = jwt.sign({
            userId: decoded.userId,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
            roles: decoded.roles
        }, secret, {expiresIn: "15m"});

        res.cookie("jwt", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "test",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
        });

        return res.status(200).json({accessToken});
    } catch (error) {
        return res.status(401).json({message: "Invalid refresh token"});
    }
});

export {generateToken, refreshAccessToken};