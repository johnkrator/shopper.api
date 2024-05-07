"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategory = exports.getCategories = exports.createCategory = void 0;
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const category_model_1 = __importDefault(require("../database/models/category.model"));
const createCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Please provide a name" });
    }
    const existingCategory = await category_model_1.default.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
    }
    const category = await category_model_1.default.create({ name });
    return res.status(201).json(category);
});
exports.createCategory = createCategory;
const getCategories = (0, asyncHandler_1.default)(async (req, res) => {
    const categories = await category_model_1.default.find();
    return res.status(200).json(categories);
});
exports.getCategories = getCategories;
const getCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const category = await category_model_1.default.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
});
exports.getCategory = getCategory;
const updateCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const category = await category_model_1.default.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    if (name) {
        category.name = name;
        await category.save();
    }
    return res.status(200).json(category);
});
exports.updateCategory = updateCategory;
const deleteCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await category_model_1.default.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({ message: "Category deleted" });
});
exports.deleteCategory = deleteCategory;
