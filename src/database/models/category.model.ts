import mongoose, {Document, Schema} from "mongoose";

// Define the interface for the category schema
export interface ICategory extends Document {
    name: string;
}

// Create the schema using the interface
const categorySchema: Schema<ICategory> = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        maxLength: 32,
        unique: true,
        required: true,
    },
});

// Create and export the Mongoose model
export default mongoose.model<ICategory>("Category", categorySchema);