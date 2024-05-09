"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const authmiddleware_1 = require("../helpers/middlewares/authmiddleware");
const verifyEmail_1 = __importDefault(require("../helpers/utils/verifyEmail"));
const verifyToken_1 = __importDefault(require("../helpers/utils/verifyToken"));
const userRouter = express_1.default.Router();
userRouter.route("/")
    .post(user_controller_1.createUser)
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.getAllUsers);
userRouter.post("/login", user_controller_1.loginUser);
userRouter.post("/change-password", verifyToken_1.default, user_controller_1.changePassword);
userRouter.post("/verify-email", verifyEmail_1.default);
userRouter.post("/resendVerificationCode", user_controller_1.resendVerificationCode);
userRouter.post("/resendResetToken", user_controller_1.resendResetToken);
userRouter.post("/forgotPassword", user_controller_1.forgotPassword);
userRouter.put("/resetPassword", user_controller_1.resetPassword); // breaking
userRouter.post("/logout", user_controller_1.logoutCurrentUser);
// oauth routes
userRouter.post("/google", user_controller_1.handleGoogleAuth);
userRouter.post("/facebook", user_controller_1.handleFacebookAuth);
userRouter.post("/github", user_controller_1.handleGitHubAuth);
userRouter.post("/apple", user_controller_1.handleAppleAuth);
userRouter.route("/profile")
    .get(authmiddleware_1.authenticate, user_controller_1.getCurrentUserProfile)
    .put(authmiddleware_1.authenticate, user_controller_1.updateCurrentUserProfile);
// Admin routes
userRouter.route("/:id")
    .delete(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.deleteUserById)
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.getUserById)
    .put(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.updateUserById);
userRouter.put("/assign-role/:id", authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.assignRole);
userRouter.put("/delete-role/:id", authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.deleteRole);
exports.default = userRouter;
//# sourceMappingURL=user.routes.js.map