import { Router } from "express";
import userController from "../controllers/userController.js";
const router = Router();
router.post("/sign-up", userController.singup);
router.post("/login", userController.login);
router.post("/refresh", userController.refresh);
router.post("/logout", userController.logout);
export default router;
