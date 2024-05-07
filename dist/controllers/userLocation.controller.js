"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLocation = void 0;
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const getCurrentLocation = (0, asyncHandler_1.default)(async (req, res) => {
    const { userId } = req.body;
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude || !userId) {
        return res.status(400).json({ message: "Invalid data" });
    }
    try {
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.location = {
            latitude,
            longitude,
        };
        await user.save();
        res.status(200).json({ message: "Location saved successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getCurrentLocation = getCurrentLocation;
