"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProductReview = exports.filterProducts = exports.fetchNewProducts = exports.fetchTopProducts = exports.fetchAllProducts = exports.getProductById = exports.fetchProducts = exports.removeProduct = exports.updateProduct = exports.addProduct = void 0;
const product_model_1 = __importDefault(require("../database/models/product.model"));
const category_model_1 = __importDefault(require("../database/models/category.model"));
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const upload_controller_1 = require("./upload.controller");
const addProduct = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, image, brand, quantity, category, description, price } = req.body;
        // Check if required fields are missing
        const missingProperties = [];
        if (!name)
            missingProperties.push("Name");
        if (!image)
            missingProperties.push("Image");
        if (!brand)
            missingProperties.push("Brand");
        if (!quantity)
            missingProperties.push("Quantity");
        if (!category)
            missingProperties.push("Category");
        if (!description)
            missingProperties.push("Description");
        if (!price)
            missingProperties.push("Price");
        if (missingProperties.length > 0) {
            return res.status(400).json({ message: `${missingProperties.join(", ")} is required` });
        }
        // Find or create the category
        let categoryObj = yield category_model_1.default.findOne({ name: category });
        if (!categoryObj) {
            categoryObj = new category_model_1.default({ name: category });
            yield categoryObj.save();
        }
        // Upload the image to Cloudinary and get the URL
        const cloudinaryResult = yield (0, upload_controller_1.uploadImageToCloudinary)(image);
        // Create the product with the Cloudinary image URL
        const product = new product_model_1.default({
            name,
            image: cloudinaryResult.secure_url, // Use the Cloudinary URL
            brand,
            quantity,
            category: categoryObj._id,
            description,
            price,
        });
        yield product.save();
        res.status(201).json({ message: "Product added successfully" });
    }
    catch (error) {
        res.status(400).json({ message: "An error occurred while adding the product" });
    }
}));
exports.addProduct = addProduct;
const updateProduct = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.params.id; // Assuming the product ID is passed in the URL
        const { name, image, brand, quantity, category, description, price } = req.body;
        // Find the product by ID
        let product = yield product_model_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Update product fields if provided in the request body
        if (name)
            product.name = name;
        if (brand)
            product.brand = brand;
        if (quantity)
            product.quantity = quantity;
        if (description)
            product.description = description;
        if (price)
            product.price = price;
        // Update product image if provided
        if (image) {
            // Upload the image to Cloudinary and get the URL
            const cloudinaryResult = yield (0, upload_controller_1.uploadImageToCloudinary)(image);
            product.image = cloudinaryResult.secure_url; // Use the Cloudinary URL
        }
        // Find or create the category and update product category
        if (category) {
            let categoryObj = yield category_model_1.default.findOne({ name: category });
            if (!categoryObj) {
                categoryObj = new category_model_1.default({ name: category });
                yield categoryObj.save();
            }
            product.category = categoryObj._id;
        }
        yield product.save();
        res.status(200).json({ message: "Product updated successfully" });
    }
    catch (error) {
        res.status(400).json({ message: "An error occurred while updating the product" });
    }
}));
exports.updateProduct = updateProduct;
/*
* Pagination query method
* http://localhost:5000/api/products/all-products?page=3&limit=10

* Filter method
* http://localhost:5000/api/products/all-products?keyword=shirt&page=2
*
* Combining the two methods to fetch products with pagination and filter by keyword
* http://localhost:5000/api/products/all-products?keyword=shirt&page=2&limit=10
* */
const fetchProducts = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Filter products based on keyword
    const keyword = req.query.keyword ? {
        $or: [
            { name: { $regex: req.query.keyword, $options: "i" } },
            { brand: { $regex: req.query.keyword, $options: "i" } },
            { description: { $regex: req.query.keyword, $options: "i" } },
        ]
    } : {};
    const count = yield product_model_1.default.countDocuments(Object.assign({}, keyword));
    const totalProducts = yield product_model_1.default.countDocuments({});
    const products = yield product_model_1.default.find(Object.assign({}, keyword))
        .skip(startIndex)
        .limit(limit);
    const totalPages = Math.ceil(totalProducts / limit) || 1;
    res.status(200).json({
        products,
        currentPage: page,
        totalPages,
        totalProducts,
        count,
    });
}));
exports.fetchProducts = fetchProducts;
/*
* Query method
* http://localhost:5000/api/products/all-products?page=2&limit=10
* */
const fetchAllProducts = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    try {
        const totalProducts = yield product_model_1.default.countDocuments({});
        const products = yield product_model_1.default.find({})
            .skip(startIndex)
            .limit(limit);
        const totalPages = Math.ceil(totalProducts / limit) || 1;
        res.status(200).json({
            products,
            currentPage: page,
            totalPages,
            totalProducts,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
}));
exports.fetchAllProducts = fetchAllProducts;
const getProductById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = req.params.id;
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
}));
exports.getProductById = getProductById;
const removeProduct = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.params.id;
        const product = yield product_model_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        yield product.deleteOne({ _id: productId });
        res.status(200).json({ message: "Product removed successfully" });
    }
    catch (error) {
        res.status(400).json({ message: "An error occurred while removing the product" });
    }
}));
exports.removeProduct = removeProduct;
const fetchTopProducts = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const startIndex = (page - 1) * limit;
    try {
        const totalProducts = yield product_model_1.default.countDocuments({});
        const products = yield product_model_1.default.find({})
            .sort({ rating: -1 })
            .skip(startIndex)
            .limit(limit);
        const totalPages = Math.ceil(totalProducts / limit) || 1;
        res.status(200).json({
            products,
            currentPage: page,
            totalPages,
            totalProducts,
        });
    }
    catch (error) {
        res.status(500).json("Server Error");
    }
}));
exports.fetchTopProducts = fetchTopProducts;
/*
* http://localhost:5000/api/products/top-products?page=2&limit=10
* */
const fetchNewProducts = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const startIndex = (page - 1) * limit;
    try {
        const totalProducts = yield product_model_1.default.countDocuments({});
        const products = yield product_model_1.default.find({})
            .sort({ _id: -1 })
            .skip(startIndex)
            .limit(limit);
        const totalPages = Math.ceil(totalProducts / limit) || 1;
        res.status(200).json({
            products,
            currentPage: page,
            totalPages,
            totalProducts,
        });
    }
    catch (error) {
        res.status(500).json("Server Error");
    }
}));
exports.fetchNewProducts = fetchNewProducts;
/*
* http://localhost:5000/api/products/new-products?page=3&limit=8
* */
const filterProducts = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { checked, radio } = req.body;
        let args = {};
        if (checked.length > 0)
            args.category = checked;
        if (radio.length)
            args.price = { $gte: radio[0], $lte: radio[1] };
    }
    catch (error) {
        res.status(400).json({ message: "An error occurred while filtering the products" });
    }
}));
exports.filterProducts = filterProducts;
const addProductReview = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { rating, comment } = req.body;
        const product = yield product_model_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const alreadyReviewed = product.reviews.find((review) => { var _a; return review.user.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString()); });
        if (alreadyReviewed) {
            return res.status(400).json({ message: "You have already reviewed this product" });
        }
        const username = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.username) || "Unknown";
        const userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || "";
        const review = {
            name: username,
            rating: Number(rating),
            comment: comment || "",
            user: userId
        };
        // @ts-ignore
        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
        yield product.save();
        res.status(200).json({ message: "Review added successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
}));
exports.addProductReview = addProductReview;
//# sourceMappingURL=product.controller.js.map