import express from "express";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import {
    createCategory,
    deleteCategory,
    getCategories,
    getCategory,
    updateCategory
} from "../controllers/category.controller";

const router = express.Router();

router.route("/")
    .post(authenticate, authorizeAdmin, createCategory);

router.route("/:id")
    .put(authenticate, authorizeAdmin, updateCategory)
    .delete(authenticate, authorizeAdmin, deleteCategory)
    .get(getCategory);

router.route("/")
    .get(getCategories);

export default router;