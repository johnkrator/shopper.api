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
exports.getCurrentLocation = void 0;
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const getCurrentLocation = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude || !userId) {
        return res.status(400).json({ message: "Invalid data" });
    }
    try {
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.location = {
            latitude,
            longitude,
        };
        yield user.save();
        res.status(200).json({ message: "Location saved successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.getCurrentLocation = getCurrentLocation;
//# sourceMappingURL=userLocation.controller.js.map