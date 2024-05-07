"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../helpers/middlewares/authmiddleware");
const category_controller_1 = require("../controllers/category.controller");
const router = express_1.default.Router();
router.route("/")
    .post(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, category_controller_1.createCategory);
router.route("/:id")
    .put(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, category_controller_1.updateCategory)
    .delete(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, category_controller_1.deleteCategory)
    .get(category_controller_1.getCategory);
router.route("/")
    .get(category_controller_1.getCategories);
exports.default = router;
