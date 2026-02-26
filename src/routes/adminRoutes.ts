import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { authenticate, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/sessions", authenticate, requireRole("admin"), adminController.getAllSessions);
router.delete("/sessions/:id", authenticate, requireRole("admin"), adminController.deleteSession);

export const adminRoutes = router;

