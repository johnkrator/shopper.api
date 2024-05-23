"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const paginate_1 = require("../helpers/utils/paginate");
const createOrder = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const itemsFromDB = yield product_model_1.default.find({ _id: { $in: itemIds } });
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
        const order = yield order_model_1.default.create({
            orderItems: dbOrderItems,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
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
}));
exports.createOrder = createOrder;
const getOrders = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = yield (0, paginate_1.paginate)(order_model_1.default, {}, page, limit, null, "user");
    res.status(200).json(result);
}));
exports.getOrders = getOrders;
/*
* http://localhost:5000/api/orders?page=3&limit=20
* */
const getUserOrders = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = yield (0, paginate_1.paginate)(order_model_1.default, { user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }, page, limit);
    res.status(200).json(result);
}));
exports.getUserOrders = getUserOrders;
/*
* http://localhost:5000/api/orders/user?page=2&limit=15
* */
const countTotalOrders = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalOrders = yield order_model_1.default.countDocuments();
        return res.status(200).json({ totalOrders });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
}));
exports.countTotalOrders = countTotalOrders;
const calculateTotalSales = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield order_model_1.default.find({});
        const totalSales = orders.reduce((sum, order) => sum + order.itemsPrice, 0);
        return res.status(200).json({ totalSales });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
}));
exports.calculateTotalSales = calculateTotalSales;
const calculateTotalSalesByDate = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const salesByDate = yield order_model_1.default.aggregate([
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
}));
exports.calculateTotalSalesByDate = calculateTotalSalesByDate;
const findOrderById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        const order = yield order_model_1.default.findById(orderId).populate("user", "username email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json(order);
    }
    catch (error) {
        console.error("Error retrieving order:", error);
        return res.status(500).json({ message: "An error occurred while retrieving orders" });
    }
}));
exports.findOrderById = findOrderById;
const markOrderAsPaid = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield order_model_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };
        const updatedOrder = yield order.save();
        return res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while updating the order" });
    }
}));
exports.markOrderAsPaid = markOrderAsPaid;
const markOrderAsDelivered = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield order_model_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.isDelivered = true;
        order.deliveredAt = new Date();
        order.deliveryResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };
        const updatedOrder = yield order.save();
        return res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while updating the order" });
    }
}));
exports.markOrderAsDelivered = markOrderAsDelivered;
//# sourceMappingURL=order.controller.js.map