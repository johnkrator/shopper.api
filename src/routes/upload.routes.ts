import express from "express";
import {
    uploadImage,
    uploadImageDirectlyOnCloudinary
} from "../controllers/upload.controller";

const router = express.Router();

// Route for uploading an image
router.route("/local").post(uploadImage);
router.route("/cloudinary").post(uploadImageDirectlyOnCloudinary);

export default router;