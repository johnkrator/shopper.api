"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrderById = exports.markOrderAsDelivered = exports.markOrderAsPaid = exports.calculateTotalSalesByDate = exports.calculateTotalSales = exports.countTotalOrders = exports.getUserOrders = exports.getOrders = exports.createOrder = void 0;
const asyncHandler_1 = __importDefault(require("../helpers/middlewares/asyncHandler"));
const product_model_1 = __importDefault(require("../database/models/product.model"));
const order_model_1 = __importDefault(require("../database/models/order.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const calcPrices_1 = __importDefault(require("../helpers/utils/calcPrices"));
const createOrder = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod } = req.body;
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ message: "Order items must be a non-empty array" });
        }
        const invalidProductIds = orderItems.filter((item) => !mongoose_1.default.isValidObjectId(item.product));
        if (invalidProductIds.length > 0) {
            return res.status(400).json({ message: "One or more product IDs are invalid" });
        }
        const itemIds = orderItems.map((item) => item.product);
        const itemsFromDB = await product_model_1.default.find({ _id: { $in: itemIds } });
        if (itemsFromDB.length !== orderItems.length) {
            return res.status(404).json({ message: "One or more items not found in the database" });
        }
        const dbOrderItems = orderItems.map((itemFromClient) => {
            const matchingItemFromDB = itemsFromDB.find((item) => item._id.toString() === itemFromClient.product.toString());
            if (!matchingItemFromDB) {
                throw new Error("Matching item not found");
            }
            return {
                name: matchingItemFromDB.name,
                qty: itemFromClient.qty,
                price: matchingItemFromDB.price,
                product: matchingItemFromDB._id.toString(),
            };
        });
        const { itemsPrice, taxPrice, shippingPrice, totalPrice } = (0, calcPrices_1.default)(dbOrderItems);
        const order = await order_model_1.default.create({
            orderItems: dbOrderItems,
            user: req.user?._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });
        return res.status(201).json(order);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An unknown error occurred" });
    }
});
exports.createOrder = createOrder;
const getOrders = (0, asyncHandler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    try {
        const totalOrders = await order_model_1.default.countDocuments({});
        const orders = await order_model_1.default.find({})
            .populate("user", "id username")
            .skip(startIndex)
            .limit(limit);
        const totalPages = Math.ceil(totalOrders / limit) || 1;
        return res.status(200).json({
            orders,
            currentPage: page,
            totalPages,
            totalOrders,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
});
exports.getOrders = getOrders;
/*
* http://localhost:5000/api/orders?page=3&limit=20
* */
const getUserOrders = (0, asyncHandler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    try {
        const totalUserOrders = await order_model_1.default.countDocuments({ user: req.user?._id });
        const orders = await order_model_1.default.find({ user: req.user?._id })
            .skip(startIndex)
            .limit(limit);
        const totalPages = Math.ceil(totalUserOrders / limit) || 1;
        res.status(200).json({
            orders,
            currentPage: page,
            totalPages,
            totalUserOrders,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
});
exports.getUserOrders = getUserOrders;
/*
* http://localhost:5000/api/orders/user?page=2&limit=15
* */
const countTotalOrders = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const totalOrders = await order_model_1.default.countDocuments();
        return res.status(200).json({ totalOrders });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
});
exports.countTotalOrders = countTotalOrders;
const calculateTotalSales = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const orders = await order_model_1.default.find({});
        const totalSales = orders.reduce((sum, order) => sum + order.itemsPrice, 0);
        return res.status(200).json({ totalSales });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
});
exports.calculateTotalSales = calculateTotalSales;
const calculateTotalSalesByDate = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const salesByDate = await order_model_1.default.aggregate([
            { $match: { isPaid: true } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
                    },
                    totalSales: { $sum: "$itemsPrice" },
                },
            },
        ]);
        return res.status(200).json({ salesByDate });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
});
exports.calculateTotalSalesByDate = calculateTotalSalesByDate;
const findOrderById = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await order_model_1.default.findById(orderId).populate("user", "username email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json(order);
    }
    catch (error) {
        console.error("Error retrieving order:", error);
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
});
exports.findOrderById = findOrderById;
const markOrderAsPaid = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const order = await order_model_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.isPaid = true;
        order.paidAt = new Date(); // Create a new Date object
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };
        const updatedOrder = await order.save();
        return res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while updating the order" });
    }
});
exports.markOrderAsPaid = markOrderAsPaid;
const markOrderAsDelivered = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const order = await order_model_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.isDelivered = true;
        order.deliveredAt = new Date(); // Create a new Date object
        order.deliveryResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };
        const updatedOrder = await order.save();
        return res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while updating the order" });
    }
});
exports.markOrderAsDelivered = markOrderAsDelivered;
