import { Router } from "express";
import contactMessageController from "../controllers/contactMessageController.ts";
import authMiddleware from "../middlewares/authMiddleware.ts";

const router = Router();

router.post("/create-message", contactMessageController.createMessage);
router.get(
  "/get-messages",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  contactMessageController.getContactMessages,
);
router.get(
  "/get-message/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  contactMessageController.getContactMessageById,
);

export default router;
