import express from "express";
import {
    assignRole, changePassword,
    createUser, deleteRole, deleteUserById, forgotPassword,
    getAllUsers,
    getCurrentUserProfile, getUserById, handleAppleAuth, handleFacebookAuth, handleGitHubAuth, handleGoogleAuth,
    loginUser,
    logoutCurrentUser, resendResetToken, resendVerificationCode, resetPassword, updateCurrentUserProfile, updateUserById
} from "../controllers/user.controller";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import verifyEmail from "../helpers/utils/verifyEmail";
import verifyToken from "../helpers/utils/verifyToken";

const router = express.Router();

router.route("/")
    .post(createUser)
    .get(authenticate, authorizeAdmin, getAllUsers);

router.post("/login", loginUser);
router.post("/change-password", verifyToken, changePassword);
router.post("/verify-email", verifyEmail);
router.post("/resendVerificationCode", resendVerificationCode);
router.post("/resendResetToken", resendResetToken);
router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword", resetPassword); // breaking
router.post("/logout", logoutCurrentUser);

// oauth routes
router.post("/google", handleGoogleAuth);
router.post("/facebook", handleFacebookAuth);
router.post("/github", handleGitHubAuth);
router.post("/apple", handleAppleAuth);

router.route("/profile")
    .get(authenticate, getCurrentUserProfile)
    .put(authenticate, updateCurrentUserProfile);

// Admin routes
router.route("/:id")
    .delete(authenticate, authorizeAdmin, deleteUserById)
    .get(authenticate, authorizeAdmin, getUserById)
    .put(authenticate, authorizeAdmin, updateUserById);

router.put("/assign-role/:id", authenticate, authorizeAdmin, assignRole);
router.put("/delete-role/:id", authenticate, authorizeAdmin, deleteRole);

export default router;