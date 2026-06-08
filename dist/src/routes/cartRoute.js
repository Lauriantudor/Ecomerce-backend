import { Router } from "express";
import cartController from "../controllers/cartController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = Router();
router.post("/", authMiddleware.verifyToken, authMiddleware.checkRole("customer"), cartController.addToCart);
router.get("/", authMiddleware.verifyToken, authMiddleware.checkRole("customer"), cartController.getCart);
router.put("/item/:id", authMiddleware.verifyToken, authMiddleware.checkRole("customer"), cartController.updateCatItemQuantity);
router.delete("/item/:id", authMiddleware.verifyToken, authMiddleware.checkRole("customer"), cartController.removeCartItem);
export default router;
