import {Request, Response} from "express";
import asyncHandler, {ICustomRequest} from "../helpers/middlewares/asyncHandler";
import Product, {IProduct} from "../database/models/product.model";
import Order, {IOrder} from "../database/models/order.model";
import mongoose from "mongoose";
import calcPrices from "../helpers/utils/calcPrices";

const createOrder = asyncHandler(async (req: ICustomRequest, res: Response) => {
    try {
        const {orderItems, shippingAddress, paymentMethod} = req.body;

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({message: "Order items must be a non-empty array"});
        }

        const invalidProductIds = orderItems.filter((item: any) => !mongoose.isValidObjectId(item.product));
        if (invalidProductIds.length > 0) {
            return res.status(400).json({message: "One or more product IDs are invalid"});
        }

        const itemIds = orderItems.map((item: any) => item.product);
        const itemsFromDB: IProduct[] = await Product.find({_id: {$in: itemIds}});

        if (itemsFromDB.length !== orderItems.length) {
            return res.status(404).json({message: "One or more items not found in the database"});
        }

        const dbOrderItems = orderItems.map((itemFromClient: any) => {
            const matchingItemFromDB = itemsFromDB.find(
                (item) => item._id.toString() === itemFromClient.product.toString()
            );

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

        const {itemsPrice, taxPrice, shippingPrice, totalPrice} = calcPrices(dbOrderItems);

        const order: IOrder = await Order.create({
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "An unknown error occurred"});
    }
});

const getOrders = asyncHandler(async (req: Request, res: Response) => {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const startIndex: number = (page - 1) * limit;

    try {
        const totalOrders: number = await Order.countDocuments({});
        const orders: IOrder[] = await Order.find({})
            .populate("user", "id username")
            .skip(startIndex)
            .limit(limit);

        const totalPages: number = Math.ceil(totalOrders / limit) || 1;

        return res.status(200).json({
            orders,
            currentPage: page,
            totalPages,
            totalOrders,
        });
    } catch (error) {
        return res.status(500).json({message: "An error occurred while retrieving orders"});
    }
});

/*
* http://localhost:5000/api/orders?page=3&limit=20
* */
const getUserOrders = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const startIndex: number = (page - 1) * limit;

    try {
        const totalUserOrders: number = await Order.countDocuments({user: req.user?._id});
        const orders: IOrder[] = await Order.find({user: req.user?._id})
            .skip(startIndex)
            .limit(limit);

        const totalPages: number = Math.ceil(totalUserOrders / limit) || 1;

        res.status(200).json({
            orders,
            currentPage: page,
            totalPages,
            totalUserOrders,
        });
    } catch (error) {
        return res.status(500).json({message: "An error occurred while retrieving orders"});
    }
});

/*
* http://localhost:5000/api/orders/user?page=2&limit=15
* */
const countTotalOrders = asyncHandler(async (req: Request, res: Response) => {
    try {
        const totalOrders: number = await Order.countDocuments();
        return res.status(200).json({totalOrders});
    } catch (error) {
        return res.status(500).json({message: "An error occurred while retrieving orders"});
    }
});

const calculateTotalSales = asyncHandler(async (req: Request, res: Response) => {
    try {
        const orders: IOrder[] = await Order.find({});
        const totalSales: number = orders.reduce((sum, order) => sum + order.itemsPrice, 0);
        return res.status(200).json({totalSales});
    } catch (error) {
        return res.status(500).json({message: "An error occurred while retrieving orders"});
    }
});

const calculateTotalSalesByDate = asyncHandler(async (req: Request, res: Response) => {
    try {
        const salesByDate = await Order.aggregate([
            {$match: {isPaid: true}},
            {
                $group: {
                    _id: {
                        $dateToString: {format: "%Y-%m-%d", date: "$paidAt"},
                    },
                    totalSales: {$sum: "$itemsPrice"},
                },
            },
        ]);

        return res.status(200).json({salesByDate});
    } catch (error) {
        return res.status(500).json({message: "An error occurred while retrieving orders"});
    }
});

const findOrderById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;

        const order: IOrder | null = await Order.findById(orderId).populate("user", "username email");

        if (!order) {
            return res.status(404).json({message: "Order not found"});
        }
        return res.status(200).json(order);
    } catch (error) {
        console.error("Error retrieving order:", error);
        return res.status(500).json({message: "An error occurred while retrieving orders"});
    }
});

const markOrderAsPaid = asyncHandler(async (req: Request, res: Response) => {
    try {
        const order: IOrder | null = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({message: "Order not found"});
        }

        order.isPaid = true;
        order.paidAt = new Date(); // Create a new Date object
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };

        const updatedOrder: IOrder | null = await order.save();
        return res.status(200).json(updatedOrder);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "An error occurred while updating the order"});
    }
});

const markOrderAsDelivered = asyncHandler(async (req: Request, res: Response) => {
    try {
        const order: IOrder | null = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({message: "Order not found"});
        }

        order.isDelivered = true;
        order.deliveredAt = new Date(); // Create a new Date object
        order.deliveryResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };

        const updatedOrder: IOrder | null = await order.save();
        return res.status(200).json(updatedOrder);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "An error occurred while updating the order"});
    }
});

export {
    createOrder,
    getOrders,
    getUserOrders,
    countTotalOrders,
    calculateTotalSales,
    calculateTotalSalesByDate,
    markOrderAsPaid,
    markOrderAsDelivered,
    findOrderById,
};