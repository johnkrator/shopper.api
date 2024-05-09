import express from "express";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import {
    createCategory,
    deleteCategory,
    getCategories,
    getCategory,
    updateCategory
} from "../controllers/category.controller";

const categoryRouter = express.Router();

categoryRouter.route("/")
    .post(authenticate, authorizeAdmin, createCategory);

categoryRouter.route("/:id")
    .put(authenticate, authorizeAdmin, updateCategory)
    .delete(authenticate, authorizeAdmin, deleteCategory)
    .get(getCategory);

categoryRouter.route("/")
    .get(getCategories);

export default categoryRouter;