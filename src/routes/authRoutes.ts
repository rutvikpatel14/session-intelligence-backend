import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";
import { loginRateLimiter } from "../middlewares/rateLimiter";
import { csrfProtection } from "../middlewares/csrf";

const router = Router();

router.post("/register", authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh", csrfProtection, authController.refresh);
router.post("/logout", csrfProtection, authenticate, authController.logout);
router.post("/verify-session", authenticate, authController.verifySession);

export const authRoutes = router;

