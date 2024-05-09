import express from "express";
import {
    uploadImage,
    uploadImageDirectlyOnCloudinary
} from "../controllers/upload.controller";

const uploadRouter = express.Router();

// Route for uploading an image
uploadRouter.route("/local").post(uploadImage);
uploadRouter.route("/cloudinary").post(uploadImageDirectlyOnCloudinary);

export default uploadRouter;