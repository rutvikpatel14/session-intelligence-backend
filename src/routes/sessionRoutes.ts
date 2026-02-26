import { Router } from "express";
import { sessionController } from "../controllers/sessionController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticate, sessionController.getMySessions);
router.delete("/:id", authenticate, sessionController.deleteMySession);
router.delete("/", authenticate, sessionController.deleteAllMySessions);

export const sessionRoutes = router;

