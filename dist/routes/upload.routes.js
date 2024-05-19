"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const uploadRouter = express_1.default.Router();
// Route for uploading an image
uploadRouter.route("/local").post(upload_controller_1.uploadImage);
uploadRouter.route("/cloudinary").post(upload_controller_1.uploadImageDirectlyOnCloudinary);
exports.default = uploadRouter;
//# sourceMappingURL=upload.routes.js.map