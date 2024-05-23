import {Request, Response} from "express";
import Product from "../database/models/product.model";
import Category from "../database/models/category.model";
import asyncHandler from "../helpers/middlewares/asyncHandler";
import {uploadImageToCloudinary} from "./upload.controller";
import {paginate} from "../helpers/utils/paginate";

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        username: string;
    };
}

interface IReview {
    name: string;
    rating: number;
    comment: string;
    user: string;
}

const addProduct = asyncHandler(async (req: Request, res: Response) => {
    try {
        const {name, image, brand, quantity, category, description, price} = req.body;

        // Check if required fields are missing
        const missingProperties: string[] = [];
        if (!name) missingProperties.push("Name");
        if (!image) missingProperties.push("Image");
        if (!brand) missingProperties.push("Brand");
        if (!quantity) missingProperties.push("Quantity");
        if (!category) missingProperties.push("Category");
        if (!description) missingProperties.push("Description");
        if (!price) missingProperties.push("Price");

        if (missingProperties.length > 0) {
            return res.status(400).json({message: `${missingProperties.join(", ")} is required`});
        }

        // Find or create the category
        let categoryObj = await Category.findOne({name: category});
        if (!categoryObj) {
            categoryObj = new Category({name: category});
            await categoryObj.save();
        }

        // Upload the image to Cloudinary and get the URL
        const cloudinaryResult = await uploadImageToCloudinary(image);

        // Create the product with the Cloudinary image URL
        const product = new Product({
            name,
            image: cloudinaryResult.secure_url, // Use the Cloudinary URL
            brand,
            quantity,
            category: categoryObj._id,
            description,
            price,
        });
        await product.save();
        res.status(201).json({message: "Product added successfully"});
    } catch (error) {
        res.status(400).json({message: "An error occurred while adding the product"});
    }
});

const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    try {
        const productId = req.params.id; // Assuming the product ID is passed in the URL
        const {name, image, brand, quantity, category, description, price} = req.body;

        // Find the product by ID
        let product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        // Update product fields if provided in the request body
        if (name) product.name = name;
        if (brand) product.brand = brand;
        if (quantity) product.quantity = quantity;
        if (description) product.description = description;
        if (price) product.price = price;

        // Update product image if provided
        if (image) {
            // Upload the image to Cloudinary and get the URL
            const cloudinaryResult = await uploadImageToCloudinary(image);
            product.image = cloudinaryResult.secure_url; // Use the Cloudinary URL
        }

        // Find or create the category and update product category
        if (category) {
            let categoryObj = await Category.findOne({name: category});
            if (!categoryObj) {
                categoryObj = new Category({name: category});
                await categoryObj.save();
            }
            product.category = categoryObj._id;
        }

        await product.save();
        res.status(200).json({message: "Product updated successfully"});
    } catch (error) {
        res.status(400).json({message: "An error occurred while updating the product"});
    }
});

/*
* Pagination query method
* http://localhost:5000/api/products/all-products?page=3&limit=10

* Filter method
* http://localhost:5000/api/products/all-products?keyword=shirt&page=2
*
* Combining the two methods to fetch products with pagination and filter by keyword
* http://localhost:5000/api/products/all-products?keyword=shirt&page=2&limit=10
* */
const fetchProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const keyword = req.query.keyword as string;

    const result = await paginate(Product, {}, page, limit, null, null, keyword);

    res.status(200).json(result);
});

/*
* Query method
* http://localhost:5000/api/products/all-products?page=2&limit=10
* */
const fetchAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await paginate(Product, {}, page, limit);

    res.status(200).json(result);
});

const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({message: "Product not found"});
    }

    res.status(200).json({product});
});

const removeProduct = asyncHandler(async (req: Request, res: Response) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        await product.deleteOne({_id: productId});
        res.status(200).json({message: "Product removed successfully"});
    } catch (error) {
        res.status(400).json({message: "An error occurred while removing the product"});
    }
});

const fetchTopProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 4;

    const result = await paginate(Product, {}, page, limit, {rating: -1});

    res.status(200).json(result);
});

/*
* http://localhost:5000/api/products/top-products?page=2&limit=10
* */
const fetchNewProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await paginate(Product, {}, page, limit, {_id: -1});

    res.status(200).json(result);
});

/*
* http://localhost:5000/api/products/new-products?page=3&limit=8
* */
const filterProducts = asyncHandler(async (req: Request, res: Response) => {
    try {
        const {checked, radio} = req.body;

        let args: any = {};
        if (checked.length > 0) args.category = checked;
        if (radio.length) args.price = {$gte: radio[0], $lte: radio[1]};
    } catch (error) {
        res.status(400).json({message: "An error occurred while filtering the products"});
    }
});

const addProductReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {rating, comment} = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        const alreadyReviewed = product.reviews.find(
            (review) => review.user.toString() === req.user?._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({message: "You have already reviewed this product"});
        }

        const username = req.user?.username || "Unknown";
        const userId = req.user?._id || "";

        const review: IReview = {
            name: username,
            rating: Number(rating),
            comment: comment || "",
            user: userId
        };

        // @ts-ignore
        product.reviews.push(review);
        product.numReviews = product.reviews.length;

        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();
        res.status(200).json({message: "Review added successfully"});
    } catch (error) {
        res.status(500).json({message: "Server Error"});
    }
});

export {
    addProduct,
    updateProduct,
    removeProduct,
    fetchProducts,
    getProductById,
    fetchAllProducts,
    fetchTopProducts,
    fetchNewProducts,
    filterProducts,
    addProductReview
};