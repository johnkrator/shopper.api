import express from "express";
import {
    changePassword,
    createUser,
    forgotPassword,
    handleAppleAuth,
    handleFacebookAuth,
    handleGitHubAuth,
    handleGoogleAuth,
    loginUser,
    logoutCurrentUser,
    resendResetToken,
    resendVerificationCode,
    resetPassword,
    verifyEmail
} from "../controllers/auth.controller";
import verifyToken from "../helpers/middlewares/verifyToken";

const authRouter = express.Router();

authRouter.post("/register", createUser);

authRouter.post("/login", loginUser);
authRouter.post("/change-password", verifyToken, changePassword);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resendVerificationCode", resendVerificationCode);
authRouter.post("/resendResetToken", resendResetToken);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.put("/resetPassword", resetPassword);
authRouter.post("/logout", logoutCurrentUser);

// oauth routes
authRouter.post("/google", handleGoogleAuth);
authRouter.post("/facebook", handleFacebookAuth);
authRouter.post("/github", handleGitHubAuth);
authRouter.post("/apple", handleAppleAuth);

export default authRouter;