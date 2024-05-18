import express from "express";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import {
    assignRole, deleteRole,
    deleteUserById,
    getAllUsers,
    getCurrentUserProfile, getUserById,
    updateCurrentUserProfile, updateUserById
} from "../controllers/user.controller";

const usersRoutes = express.Router();

usersRoutes.route("/")
    .get(authenticate, authorizeAdmin, getAllUsers);

usersRoutes.route("/profile")
    .get(authenticate, getCurrentUserProfile)
    .put(authenticate, updateCurrentUserProfile);

// Admin routes
usersRoutes.route("/:id")
    .delete(authenticate, authorizeAdmin, deleteUserById)
    .get(authenticate, authorizeAdmin, getUserById)
    .put(authenticate, authorizeAdmin, updateUserById);

usersRoutes.put("/assign-role/:id", authenticate, authorizeAdmin, assignRole);
usersRoutes.put("/delete-role/:id", authenticate, authorizeAdmin, deleteRole);

export default usersRoutes;