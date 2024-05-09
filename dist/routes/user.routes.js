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
const router = express_1.default.Router();
router.route("/")
    .post(user_controller_1.createUser)
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.getAllUsers);
router.post("/login", user_controller_1.loginUser);
router.post("/change-password", verifyToken_1.default, user_controller_1.changePassword);
router.post("/verify-email", verifyEmail_1.default);
router.post("/resendVerificationCode", user_controller_1.resendVerificationCode);
router.post("/resendResetToken", user_controller_1.resendResetToken);
router.post("/forgotPassword", user_controller_1.forgotPassword);
router.put("/resetPassword", user_controller_1.resetPassword); // breaking
router.post("/logout", user_controller_1.logoutCurrentUser);
// oauth routes
router.post("/google", user_controller_1.handleGoogleAuth);
router.post("/facebook", user_controller_1.handleFacebookAuth);
router.post("/github", user_controller_1.handleGitHubAuth);
router.post("/apple", user_controller_1.handleAppleAuth);
router.route("/profile")
    .get(authmiddleware_1.authenticate, user_controller_1.getCurrentUserProfile)
    .put(authmiddleware_1.authenticate, user_controller_1.updateCurrentUserProfile);
// Admin routes
router.route("/:id")
    .delete(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.deleteUserById)
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.getUserById)
    .put(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.updateUserById);
router.put("/assign-role/:id", authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.assignRole);
router.put("/delete-role/:id", authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.deleteRole);
exports.default = router;
//# sourceMappingURL=user.routes.js.map