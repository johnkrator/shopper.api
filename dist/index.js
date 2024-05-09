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
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const userLocation_routes_1 = __importDefault(require("./routes/userLocation.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const errorMiddleware_1 = require("./helpers/middlewares/errorMiddleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerOptions_1 = __importDefault(require("./helpers/swaggerConfig/swaggerOptions"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, db_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Serve Swagger documentation
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerOptions_1.default));
app.get("/api", (req, res) => {
    res.status(200).send("Welcome to the Shopper API");
});
app.use("/api/users", user_routes_1.default);
app.use("/api/user", userLocation_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/category", category_routes_1.default);
app.use("/api/order", order_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.get("/api/config/paypal", (req, res) => {
    res.send({
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        sandbox: process.env.PAYPAL_SANDBOX
    });
});
// Serving the static files from the public folder
app.use("/public", express_1.default.static(node_path_1.default.join(node_path_1.default.resolve(), "/uploads")));
// Error middleware
app.use(errorMiddleware_1.notFoundErrorHandler);
app.use(errorMiddleware_1.generalErrorHandler);
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map