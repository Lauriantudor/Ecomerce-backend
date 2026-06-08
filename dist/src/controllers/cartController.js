import prisma from "../prisma.js";
//ADD TO CARD
const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorize. Please login",
        });
    }
    try {
        if (!productId || !quantity || quantity <= 0) {
            return res
                .status(400)
                .json({ message: "Invalid product ID or quantity." });
        }
        const product = await prisma.product.findUnique({
            where: {
                id: Number(productId),
            },
        });
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }
        if (product.stock < Number(quantity)) {
            return res.status(400).json({
                message: `Only ${product.stock} left in stock`,
            });
        }
        let cart = await prisma.cart.findUnique({
            where: { userId: Number(userId) },
        });
        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: Number(userId) },
            });
        }
        let cartItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: Number(productId),
            },
        });
        if (cartItem) {
            cartItem = await prisma.cartItem.update({
                where: { id: cartItem.id },
                data: {
                    quantity: {
                        increment: Number(quantity),
                    },
                },
            });
        }
        else {
            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: Number(productId),
                    quantity: Number(quantity),
                },
            });
        }
        return res.status(200).json({ message: "Product added to cart", cartItem });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//GET CART
const getCart = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized. Please login",
        });
    }
    try {
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
            return res.status(200).json({
                message: "Your cart is empty.",
                items: [],
            });
        }
        return res.status(200).json({
            message: "Cart retrieved successfully",
            cart,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
// UPDATE ITEM QUANTITY IN CART
const updateCatItemQuantity = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorize. Please login",
        });
    }
    try {
        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be at least 1",
            });
        }
        const cartItem = await prisma.cartItem.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                cart: true,
            },
        });
        if (!cartItem || cartItem.cart.userId !== Number(userId)) {
            return res
                .status(404)
                .json({ message: "Cart item not found or unauthorized." });
        }
        const product = await prisma.product.findUnique({
            where: { id: cartItem.productId },
        });
        if (product && product.stock < Number(quantity)) {
            return res
                .status(400)
                .json({ message: `Only ${product.stock} items left in stock.` });
        }
        const updatedItem = await prisma.cartItem.update({
            where: { id: Number(id) },
            data: { quantity: Number(quantity) },
        });
        return res.status(200).json({ message: "Quantity updated", updatedItem });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
// REMOVE ITEM FROM CART
const removeCartItem = async (req, res) => {
    const { id } = req.params; // ID-ul din tabela CartItem
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized." });
    try {
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: Number(id) },
            include: { cart: true },
        });
        if (!cartItem || cartItem.cart.userId !== Number(userId)) {
            return res
                .status(404)
                .json({ message: "Cart item not found or unauthorized." });
        }
        await prisma.cartItem.delete({
            where: { id: Number(id) },
        });
        return res
            .status(200)
            .json({ message: "Product removed from cart successfully." });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
const cartController = {
    addToCart,
    getCart,
    updateCatItemQuantity,
    removeCartItem,
};
export default cartController;
