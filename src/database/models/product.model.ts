import mongoose, {Document, Schema} from "mongoose";

interface IReview extends Document {
    name: string;
    rating: number;
    comment: string;
    user: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    reviews: IReview[];
}

const reviewSchema: Schema<IReview> = new mongoose.Schema({
    name: {type: String, required: true},
    rating: {type: Number, required: true},
    comment: {type: String, required: true},
    user: {type: Schema.Types.ObjectId, ref: "User", required: true},
}, {timestamps: true});

export interface IProduct extends Document {
    name: string;
    image: string;
    brand: string;
    quantity: number;
    category: mongoose.Types.ObjectId;
    description: string;
    reviews: IReview[];
    rating: number;
    numReviews: number;
    price: number;
    countInStock: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const productSchema: Schema<IProduct> = new mongoose.Schema({
    name: {type: String, required: true},
    image: {type: String, required: true, default: "https://via.placeholder.com/150x150"},
    brand: {type: String, required: true},
    quantity: {type: Number, required: true},
    category: {type: Schema.Types.ObjectId, ref: "Category", required: true},
    description: {type: String, required: true},
    reviews: [reviewSchema],
    rating: {type: Number, required: true, default: 0},
    numReviews: {type: Number, required: true, default: 0},
    price: {type: Number, required: true},
    countInStock: {type: Number, required: true, default: 0},
}, {timestamps: true});

export default mongoose.model<IProduct>("Product", productSchema);
