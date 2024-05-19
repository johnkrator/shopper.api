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
exports.deleteCategory = exports.updateCategory = exports.getCategory = exports.getCategories = exports.createCategory = void 0;
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const category_model_1 = __importDefault(require("../database/models/category.model"));
const createCategory = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Please provide a name" });
    }
    const existingCategory = yield category_model_1.default.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
    }
    const category = yield category_model_1.default.create({ name });
    return res.status(201).json(category);
}));
exports.createCategory = createCategory;
const getCategories = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield category_model_1.default.find();
    return res.status(200).json(categories);
}));
exports.getCategories = getCategories;
const getCategory = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const category = yield category_model_1.default.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
}));
exports.getCategory = getCategory;
const updateCategory = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body;
    const category = yield category_model_1.default.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    if (name) {
        category.name = name;
        yield category.save();
    }
    return res.status(200).json(category);
}));
exports.updateCategory = updateCategory;
const deleteCategory = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield category_model_1.default.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({ message: "Category deleted" });
}));
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map