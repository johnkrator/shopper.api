import express from "express";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import {
    calculateTotalSales, calculateTotalSalesByDate,
    countTotalOrders,
    createOrder, findOrderById,
    getOrders,
    getUserOrders, markOrderAsDelivered, markOrderAsPaid
} from "../controllers/order.controller";

const orderRouter = express.Router();

orderRouter.route("/")
    .post(authenticate, createOrder)
    .get(authenticate, authorizeAdmin, getOrders);

orderRouter.route("/mine").get(authenticate, getUserOrders);
orderRouter.route("/total-orders").get(countTotalOrders);
orderRouter.route("/total-sales").get(calculateTotalSales);
orderRouter.route("/total-sales-by-date").get(calculateTotalSalesByDate);
orderRouter.route("/:id").get(authenticate, findOrderById);
orderRouter.route("/:id/pay").put(authenticate, markOrderAsPaid);
orderRouter.route("/:id/deliver").put(authenticate, authorizeAdmin, markOrderAsDelivered);

export default orderRouter;