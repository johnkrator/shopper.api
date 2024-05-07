import dotenv from "dotenv";
import cloudinary from "cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";
import asyncHandler from "../helpers/middlewares/asyncHandler";

dotenv.config();

// Get the directory path of the current script file
const currentDir = path.dirname(require.main?.filename || process.cwd());

// Load environment variables from the .env file
dotenv.config({path: path.join(currentDir, ".env")});

// Check if environment variables are properly loaded
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing Cloudinary environment variables.");
    process.exit(1); // Exit the process if essential variables are missing
}

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define storage and file filter for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, "uploads");
        fs.mkdir(uploadsDir, {recursive: true}, (err) => {
            if (err && err.code !== "EEXIST") {
                cb(err, "");
            } else {
                cb(null, uploadsDir);
            }
        });
    },
    filename: (req, file, cb) => {
        const extname = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${extname}`);
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const filetypes = /jpe?g|png|webp/;
    const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (filetypes.test(extname) && mimetypes.test(mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Images only"), false);
    }
};

// Initialize multer with storage and file filter
const upload = multer({storage, fileFilter: fileFilter as any});
const uploadSingleImage = upload.single("image");

// Upload controller function
export const uploadImage = asyncHandler(async (req, res) => {
    uploadSingleImage(req, res, (err) => {
        if (err) {
            res.status(400).send({message: err.message});
        } else if (req.file) {
            res.status(200).send({
                message: "Image uploaded successfully",
                image: `/${req.file.path.replace(/\\/g, "/")}`, // Replace backslashes with forward slashes for URL compatibility
            });
        } else {
            res.status(400).send({message: "No image file provided"});
        }
    });
});

// Helper function to upload image to Cloudinary
export const uploadImageToCloudinary = async (image: string) => {
    // Assuming `image` is a file path or a URL that can be uploaded to Cloudinary
    const result = await cloudinary.v2.uploader.upload(image);
    return result;
};

// Upload controller function for Cloudinary
export const uploadImageDirectlyOnCloudinary = asyncHandler(async (req, res) => {
    uploadSingleImage(req, res, async (err) => {
        if (err) {
            res.status(400).send({message: err.message});
        } else if (req.file) {
            const localFilePath = req.file.path; // Store the local file path

            try {
                const result = await cloudinary.v2.uploader.upload(localFilePath);
                res.status(200).send({
                    message: "Image uploaded successfully",
                    image: result.secure_url,
                });
            } catch (cloudinaryError) {
                res.status(500).send({message: "Error uploading image to Cloudinary"});
                console.error(cloudinaryError);
            } finally {
                // Remove the locally saved file
                fs.unlinkSync(localFilePath);
            }
        } else {
            res.status(400).send({message: "No image file provided"});
        }
    });
});