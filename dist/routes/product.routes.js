"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../helpers/middlewares/authmiddleware");
const product_controller_1 = require("../controllers/product.controller");
const checkId_1 = __importDefault(require("../helpers/middlewares/checkId"));
const productRouter = express_1.default.Router();
productRouter
    .route("/")
    .post(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, product_controller_1.addProduct)
    .get(product_controller_1.fetchProducts);
productRouter.route("/all-products").get(product_controller_1.fetchAllProducts);
productRouter.route("/:id/reviews").post(authmiddleware_1.authenticate, checkId_1.default, product_controller_1.addProductReview);
productRouter.route("/filtered-products").post(product_controller_1.filterProducts);
productRouter.get("/top", product_controller_1.fetchTopProducts);
productRouter.get("/new", product_controller_1.fetchNewProducts);
productRouter
    .route("/:id")
    .get(product_controller_1.getProductById)
    .put(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, product_controller_1.updateProduct)
    .delete(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, product_controller_1.removeProduct);
exports.default = productRouter;
//# sourceMappingURL=product.routes.js.map