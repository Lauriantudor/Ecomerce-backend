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
        let cart = await prisma.cart.findUnique({
            where: { userId: userId },
        });
    }
    catch (error) { }
};
