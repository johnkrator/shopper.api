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

const router = express.Router();

router
    .route("/")
    .post(authenticate, authorizeAdmin, addProduct)
    .get(fetchProducts);

router.route("/all-products").get(fetchAllProducts);
router.route("/:id/reviews").post(authenticate, checkId, addProductReview);
router.route("/filtered-products").post(filterProducts);

router.get("/top", fetchTopProducts);
router.get("/new", fetchNewProducts);

router
    .route("/:id",)
    .get(getProductById)
    .put(authenticate, authorizeAdmin, updateProduct)
    .delete(authenticate, authorizeAdmin, removeProduct);

export default router;