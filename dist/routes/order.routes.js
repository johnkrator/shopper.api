"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../helpers/middlewares/authmiddleware");
const order_controller_1 = require("../controllers/order.controller");
const orderRouter = express_1.default.Router();
orderRouter.route("/")
    .post(authmiddleware_1.authenticate, order_controller_1.createOrder)
    .get(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, order_controller_1.getOrders);
orderRouter.route("/mine").get(authmiddleware_1.authenticate, order_controller_1.getUserOrders);
orderRouter.route("/total-orders").get(order_controller_1.countTotalOrders);
orderRouter.route("/total-sales").get(order_controller_1.calculateTotalSales);
orderRouter.route("/total-sales-by-date").get(order_controller_1.calculateTotalSalesByDate);
orderRouter.route("/:id").get(authmiddleware_1.authenticate, order_controller_1.findOrderById);
orderRouter.route("/:id/pay").put(authmiddleware_1.authenticate, order_controller_1.markOrderAsPaid);
orderRouter.route("/:id/deliver").put(authmiddleware_1.authenticate, authmiddleware_1.authorizeAdmin, order_controller_1.markOrderAsDelivered);
exports.default = orderRouter;
//# sourceMappingURL=order.routes.js.map