"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./database/config/db"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const userLocation_routes_1 = __importDefault(require("./routes/userLocation.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const errorMiddleware_1 = require("./helpers/middlewares/errorMiddleware");
const redis_1 = require("redis");
const node_process_1 = __importDefault(require("node:process"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, db_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Define the base URL for your API
const apiBaseURL = node_process_1.default.env.API_BASE_URL;
app.get(apiBaseURL, (_req, res) => {
    res.status(200).send("Welcome to the Shopper API");
});
// Use the base URL for all your routes
app.use(`${apiBaseURL}/auth`, auth_routes_1.default);
app.use(`${apiBaseURL}/users`, users_routes_1.default);
app.use(`${apiBaseURL}/user`, userLocation_routes_1.default);
app.use(`${apiBaseURL}/products`, product_routes_1.default);
app.use(`${apiBaseURL}/category`, category_routes_1.default);
app.use(`${apiBaseURL}/order`, order_routes_1.default);
app.use(`${apiBaseURL}/upload`, upload_routes_1.default);
app.get(`${apiBaseURL}/config/paypal`, (_req, res) => {
    res.send({
        clientId: node_process_1.default.env.PAYPAL_CLIENT_ID,
        clientSecret: node_process_1.default.env.PAYPAL_CLIENT_SECRET,
        sandbox: node_process_1.default.env.PAYPAL_SANDBOX
    });
});
// Serving the static files from the public folder
app.use("/public", express_1.default.static(node_path_1.default.join(node_path_1.default.resolve(), "/uploads")));
// Error middleware
app.use(errorMiddleware_1.notFoundErrorHandler);
app.use(errorMiddleware_1.generalErrorHandler);
// Redis connection
const redisClient = (0, redis_1.createClient)({
    url: `redis://${node_process_1.default.env.REDIS_HOST}:6379`,
});
redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});
const port = node_process_1.default.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map