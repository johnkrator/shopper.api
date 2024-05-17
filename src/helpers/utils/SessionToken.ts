import jwt, {Secret} from "jsonwebtoken";

interface Response {
    status(code: number): Response;

    json(data: any): void;

    cookie(name: string, value: string, options: any): Response;
}

const generateTokens = (userId: string, username: string, isAdmin: boolean, roles: string[]) => {
    const secret: Secret | undefined = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret is not defined");
    }

    const accessToken = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "15m"});
    const refreshToken = jwt.sign({userId, username, isAdmin, roles}, secret, {expiresIn: "7d"});

    return {accessToken, refreshToken};
};

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "test",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
};

export {generateTokens, setTokenCookies};