import path from "node:path";
import cookieParser from "cookie-parser";
import connectDB from "./database/config/db";
import express, {Application} from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import userLocationRoutes from "./routes/userLocation.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import uploadRoutes from "./routes/upload.routes";

dotenv.config();

const app: Application = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the Shopper API");
});

app.use("/api/users", userRoutes);
app.use("/api/user", userLocationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/config/paypal", (req, res) => {
    res.send({
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        sandbox: process.env.PAYPAL_SANDBOX
    });
});

// Serving the static files from the public folder
app.use("/public", express.static(path.join(path.resolve(), "/uploads")));

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
