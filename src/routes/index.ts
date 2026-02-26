import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { sessionRoutes } from "./sessionRoutes";
import { adminRoutes } from "./adminRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
router.use("/admin", adminRoutes);

export const routes = router;

