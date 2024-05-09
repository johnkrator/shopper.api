import express from "express";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import {
    addProduct, addProductReview,
    fetchAllProducts, fetchNewProducts,
    fetchProducts, fetchTopProducts, filterProducts,
    getProductById, removeProduct,
    updateProduct
} from "../controllers/product.controller";
import checkId from "../helpers/middlewares/checkId";

const productRouter = express.Router();

productRouter
    .route("/")
    .post(authenticate, authorizeAdmin, addProduct)
    .get(fetchProducts);

productRouter.route("/all-products").get(fetchAllProducts);
productRouter.route("/:id/reviews").post(authenticate, checkId, addProductReview);
productRouter.route("/filtered-products").post(filterProducts);

productRouter.get("/top", fetchTopProducts);
productRouter.get("/new", fetchNewProducts);

productRouter
    .route("/:id",)
    .get(getProductById)
    .put(authenticate, authorizeAdmin, updateProduct)
    .delete(authenticate, authorizeAdmin, removeProduct);

export default productRouter;