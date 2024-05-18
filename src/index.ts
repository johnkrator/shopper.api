import path from "node:path";
import cookieParser from "cookie-parser";
import connectDB from "./database/config/db";
import express, {Application, Request, Response} from "express";
import dotenv from "dotenv";
import AuthRoutes from "./routes/auth.routes";
import UserRoutes from "./routes/users.routes";
import UserLocationRoutes from "./routes/userLocation.routes";
import ProductRoutes from "./routes/product.routes";
import CategoryRoutes from "./routes/category.routes";
import OrderRoutes from "./routes/order.routes";
import UploadRoutes from "./routes/upload.routes";
import {generalErrorHandler, notFoundErrorHandler} from "./helpers/middlewares/errorMiddleware";

dotenv.config();

const app: Application = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/api", (_req: Request, res: Response) => {
    res.status(200).send("Welcome to the Shopper API");
});

app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/user", UserLocationRoutes);
app.use("/api/products", ProductRoutes);
app.use("/api/category", CategoryRoutes);
app.use("/api/order", OrderRoutes);
app.use("/api/upload", UploadRoutes);

app.get("/api/config/paypal", (req, res) => {
    res.send({
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        sandbox: process.env.PAYPAL_SANDBOX
    });
});

// Serving the static files from the public folder
app.use("/public", express.static(path.join(path.resolve(), "/uploads")));

// Error middleware
app.use(notFoundErrorHandler);
app.use(generalErrorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});