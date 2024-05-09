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

const userRouter = express.Router();

userRouter.route("/")
    .post(createUser)
    .get(authenticate, authorizeAdmin, getAllUsers);

userRouter.post("/login", loginUser);
userRouter.post("/change-password", verifyToken, changePassword);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resendVerificationCode", resendVerificationCode);
userRouter.post("/resendResetToken", resendResetToken);
userRouter.post("/forgotPassword", forgotPassword);
userRouter.put("/resetPassword", resetPassword); // breaking
userRouter.post("/logout", logoutCurrentUser);

// oauth routes
userRouter.post("/google", handleGoogleAuth);
userRouter.post("/facebook", handleFacebookAuth);
userRouter.post("/github", handleGitHubAuth);
userRouter.post("/apple", handleAppleAuth);

userRouter.route("/profile")
    .get(authenticate, getCurrentUserProfile)
    .put(authenticate, updateCurrentUserProfile);

// Admin routes
userRouter.route("/:id")
    .delete(authenticate, authorizeAdmin, deleteUserById)
    .get(authenticate, authorizeAdmin, getUserById)
    .put(authenticate, authorizeAdmin, updateUserById);

userRouter.put("/assign-role/:id", authenticate, authorizeAdmin, assignRole);
userRouter.put("/delete-role/:id", authenticate, authorizeAdmin, deleteRole);

export default userRouter;