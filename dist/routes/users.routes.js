"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../helpers/middlewares/authmiddleware");
const user_controller_1 = require("../controllers/user.controller");
const usersRoutes = express_1.default.Router();
usersRoutes.route("/")
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.getAllUsers);
usersRoutes.route("/profile")
    .get(authmiddleware_1.authenticate, user_controller_1.getCurrentUserProfile)
    .put(authmiddleware_1.authenticate, user_controller_1.updateCurrentUserProfile);
// Admin routes
usersRoutes.route("/:id")
    .delete(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.deleteUserById)
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.getUserById)
    .put(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.updateUserById);
usersRoutes.put("/assign-role/:id", authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.assignRole);
usersRoutes.put("/delete-role/:id", authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, user_controller_1.deleteRole);
exports.default = usersRoutes;
//# sourceMappingURL=users.routes.js.map