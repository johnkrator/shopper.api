"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Create the schema using the interface
const categorySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        trim: true,
        maxLength: 32,
        unique: true,
        required: true,
    },
});
// Create and export the Mongoose model
exports.default = mongoose_1.default.model("Category", categorySchema);
