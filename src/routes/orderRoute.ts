import { Router } from "express";
import orderController from "../controllers/orderController.ts";
import authMiddleware from "../middlewares/authMiddleware.ts";

const router = Router();

router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("customer"),
  orderController.createOrder,
);
router.get(
  "/my-orders",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("customer"),
  orderController.gerUserOrder,
);
router.get(
  "/admin/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  orderController.getAllOrders,
);
router.put(
  "/admin/:id/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  orderController.updateOrderStatus,
);
export default router;
