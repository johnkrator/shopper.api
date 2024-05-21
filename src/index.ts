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
import {createClient} from "redis";
import process from "node:process";

dotenv.config();

const app: Application = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Define the base URL for your API
const apiBaseURL = process.env.API_BASE_URL;

app.get(apiBaseURL, (_req: Request, res: Response) => {
    res.status(200).send("Welcome to the Shopper API");
});

// Use the base URL for all your routes
app.use(`${apiBaseURL}/auth`, AuthRoutes);
app.use(`${apiBaseURL}/users`, UserRoutes);
app.use(`${apiBaseURL}/user`, UserLocationRoutes);
app.use(`${apiBaseURL}/products`, ProductRoutes);
app.use(`${apiBaseURL}/category`, CategoryRoutes);
app.use(`${apiBaseURL}/order`, OrderRoutes);
app.use(`${apiBaseURL}/upload`, UploadRoutes);

app.get(`${apiBaseURL}/config/paypal`, (_req, res) => {
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

// Redis connection
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:6379`,
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});