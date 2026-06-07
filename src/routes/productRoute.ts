import { Router } from "express";
import productController from "../controllers/productController.ts";
import authMiddleware from "../middlewares/authMiddleware.ts";
import upload from "../middlewares/uploadMiddleware.ts";
const router = Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  upload.single("image"),
  productController.createProduct,
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  upload.single("image"),
  productController.updateProduct,
);
router.patch(
  "/addstock/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  productController.addProductStock,
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  productController.deleteProduct,
);

export default router;
