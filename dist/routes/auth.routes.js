"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const verifyToken_1 = __importDefault(require("../helpers/middlewares/verifyToken"));
const authRouter = express_1.default.Router();
authRouter.post("/register", auth_controller_1.createUser);
authRouter.post("/login", auth_controller_1.loginUser);
authRouter.post("/change-password", verifyToken_1.default, auth_controller_1.changePassword);
authRouter.post("/verify-email", auth_controller_1.verifyEmail);
authRouter.post("/resendVerificationCode", auth_controller_1.resendVerificationCode);
authRouter.post("/resendResetToken", auth_controller_1.resendResetToken);
authRouter.post("/forgotPassword", auth_controller_1.forgotPassword);
authRouter.put("/resetPassword", auth_controller_1.resetPassword);
authRouter.post("/logout", auth_controller_1.logoutCurrentUser);
// oauth routes
authRouter.post("/google", auth_controller_1.handleGoogleAuth);
authRouter.post("/facebook", auth_controller_1.handleFacebookAuth);
authRouter.post("/github", auth_controller_1.handleGitHubAuth);
authRouter.post("/apple", auth_controller_1.handleAppleAuth);
exports.default = authRouter;
//# sourceMappingURL=auth.routes.js.map