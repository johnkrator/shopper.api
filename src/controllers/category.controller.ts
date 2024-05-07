import {Request, Response} from "express";
import asyncHandler from "../helpers/middlewares/asyncHandler";
import Category from "../database/models/category.model";

interface CategoryRequest extends Request {
    body: { name?: string };
    params: { id?: string };
}

const createCategory = asyncHandler(async (req: CategoryRequest, res: Response) => {
    const {name} = req.body;

    if (!name) {
        return res.status(400).json({message: "Please provide a name"});
    }

    const existingCategory = await Category.findOne({name});
    if (existingCategory) {
        return res.status(400).json({message: "Category already exists"});
    }

    const category = await Category.create({name});
    return res.status(201).json(category);
});

const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await Category.find();
    return res.status(200).json(categories);
});

const getCategory = asyncHandler(async (req: CategoryRequest, res: Response) => {
    const {id} = req.params;
    const category = await Category.findById(id);
    if (!category) {
        return res.status(404).json({message: "Category not found"});
    }
    return res.status(200).json(category);
});

const updateCategory = asyncHandler(async (req: CategoryRequest, res: Response) => {
    const {id} = req.params;
    const {name} = req.body;
    const category = await Category.findById(id);
    if (!category) {
        return res.status(404).json({message: "Category not found"});
    }
    if (name) {
        category.name = name;
        await category.save();
    }
    return res.status(200).json(category);
});

const deleteCategory = asyncHandler(async (req: CategoryRequest, res: Response) => {
    const {id} = req.params;
    const result = await Category.deleteOne({_id: id});
    if (result.deletedCount === 0) {
        return res.status(404).json({message: "Category not found"});
    }
    return res.status(200).json({message: "Category deleted"});
});

export {createCategory, getCategories, getCategory, updateCategory, deleteCategory};