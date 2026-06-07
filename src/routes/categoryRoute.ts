import { Router } from "express";
import categoryControler from "../controllers/categoryController.ts";
import authMiddleware from "../middlewares/authMiddleware.ts";

const router = Router();

router.get("/", categoryControler.getCategories);
router.get("/:id", categoryControler.getCategoryById);
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  categoryControler.createCategory,
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  categoryControler.updateCategory,
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  categoryControler.deleteCategory,
);

export default router;
