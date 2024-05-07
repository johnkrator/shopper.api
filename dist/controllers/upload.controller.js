"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageDirectlyOnCloudinary = exports.uploadImageToCloudinary = exports.uploadImage = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
dotenv_1.default.config();
// Get the directory path of the current script file
const currentDir = path_1.default.dirname(require.main?.filename || process.cwd());
// Load environment variables from the .env file
dotenv_1.default.config({ path: path_1.default.join(currentDir, ".env") });
// Check if environment variables are properly loaded
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing Cloudinary environment variables.");
    process.exit(1); // Exit the process if essential variables are missing
}
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Define storage and file filter for multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path_1.default.join(__dirname, "uploads");
        fs_1.default.mkdir(uploadsDir, { recursive: true }, (err) => {
            if (err && err.code !== "EEXIST") {
                cb(err, "");
            }
            else {
                cb(null, uploadsDir);
            }
        });
    },
    filename: (req, file, cb) => {
        const extname = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${extname}`);
    },
});
const fileFilter = (req, file, cb) => {
    const filetypes = /jpe?g|png|webp/;
    const mimetypes = /image\/jpe?g|image\/png|image\/webp/;
    const extname = path_1.default.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;
    if (filetypes.test(extname) && mimetypes.test(mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Images only"), false);
    }
};
// Initialize multer with storage and file filter
const upload = (0, multer_1.default)({ storage, fileFilter: fileFilter });
const uploadSingleImage = upload.single("image");
// Upload controller function
exports.uploadImage = (0, asyncHandler_1.default)(async (req, res) => {
    uploadSingleImage(req, res, (err) => {
        if (err) {
            res.status(400).send({ message: err.message });
        }
        else if (req.file) {
            res.status(200).send({
                message: "Image uploaded successfully",
                image: `/${req.file.path.replace(/\\/g, "/")}`, // Replace backslashes with forward slashes for URL compatibility
            });
        }
        else {
            res.status(400).send({ message: "No image file provided" });
        }
    });
});
// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (image) => {
    // Assuming `image` is a file path or a URL that can be uploaded to Cloudinary
    const result = await cloudinary_1.default.v2.uploader.upload(image);
    return result;
};
exports.uploadImageToCloudinary = uploadImageToCloudinary;
// Upload controller function for Cloudinary
exports.uploadImageDirectlyOnCloudinary = (0, asyncHandler_1.default)(async (req, res) => {
    uploadSingleImage(req, res, async (err) => {
        if (err) {
            res.status(400).send({ message: err.message });
        }
        else if (req.file) {
            const localFilePath = req.file.path; // Store the local file path
            try {
                const result = await cloudinary_1.default.v2.uploader.upload(localFilePath);
                res.status(200).send({
                    message: "Image uploaded successfully",
                    image: result.secure_url,
                });
            }
            catch (cloudinaryError) {
                res.status(500).send({ message: "Error uploading image to Cloudinary" });
                console.error(cloudinaryError);
            }
            finally {
                // Remove the locally saved file
                fs_1.default.unlinkSync(localFilePath);
            }
        }
        else {
            res.status(400).send({ message: "No image file provided" });
        }
    });
});
