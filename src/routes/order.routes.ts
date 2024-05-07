import express from "express";
import {authenticate, authorizeAdmin} from "../helpers/middlewares/authmiddleware";
import {
    calculateTotalSales, calculateTotalSalesByDate,
    countTotalOrders,
    createOrder, findOrderById,
    getOrders,
    getUserOrders, markOrderAsDelivered, markOrderAsPaid
} from "../controllers/order.controller";

const router = express.Router();

router.route("/")
    .post(authenticate, createOrder)
    .get(authenticate, authorizeAdmin, getOrders);

router.route("/mine").get(authenticate, getUserOrders);
router.route("/total-orders").get(countTotalOrders);
router.route("/total-sales").get(calculateTotalSales);
router.route("/total-sales-by-date").get(calculateTotalSalesByDate);
router.route("/:id").get(authenticate, findOrderById);
router.route("/:id/pay").put(authenticate, markOrderAsPaid);
router.route("/:id/deliver").put(authenticate, authorizeAdmin, markOrderAsDelivered);

export default router;