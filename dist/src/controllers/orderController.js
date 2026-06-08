import prisma from "../prisma.js";
//PLACE A DETAILED ORDER (From Cart)
const createOrder = async (req, res) => {
    const { addressId } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized. Please login.",
        });
    }
    try {
        if (!addressId) {
            return res.status(400).json({
                message: "Delevery address is required",
            });
        }
        const address = await prisma.address.findUnique({
            where: {
                id: Number(addressId),
            },
        });
        if (!address || address.userId !== Number(userId)) {
            return res.status(404).json({
                message: "Invalid or unathorize address.",
            });
        }
        const cart = await prisma.cart.findUnique({
            where: {
                userId: Number(userId),
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty. Cannot place an order.",
            });
        }
        let totalAmount = 0;
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for product "${item.product.name}". Only ${item.product.stock} items left.`,
                });
            }
            totalAmount += item.product.price * item.quantity;
        }
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId: Number(userId),
                    addressId: Number(addressId),
                    totalAmount: totalAmount,
                    status: "panding",
                },
            });
            for (const item of cart.items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        quantity: item.quantity,
                    },
                });
                await tx.product.update({
                    where: {
                        id: item.productId,
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }
            await tx.cartItem.deleteMany({
                where: {
                    cartId: cart.id,
                },
            });
            return order;
        });
        return res.status(201).json({
            message: "Order placed successfuly!",
        });
    }
    catch (error) {
        return res.status(201).json({
            message: "Internal sever error",
            error: error,
        });
    }
};
// GET USER'S ORDER
const gerUserOrder = async (req, res) => {
    const userId = req.user?.id;
    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: Number(userId),
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                address: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({ orders });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};
// GET ALL ORDERS
const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: true,
                    },
                },
                address: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({ orders });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server erorr",
            error: error,
        });
    }
};
const orderController = {
    createOrder,
    gerUserOrder,
    getAllOrders,
};
export default orderController;
