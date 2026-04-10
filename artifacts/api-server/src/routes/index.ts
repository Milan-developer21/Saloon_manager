// Main router for the Saloon Manager API
// Combines all route modules into a single router

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import saloonsRouter from "./saloons.js";
import bookingsRouter from "./bookings.js";

// Create main router instance
const router: IRouter = Router();

// Mount health check routes (no prefix)
router.use(healthRouter);

// Mount authentication routes under /auth
router.use("/auth", authRouter);

// Mount saloon management routes under /saloons
router.use("/saloons", saloonsRouter);

// Mount booking management routes under /bookings
router.use("/bookings", bookingsRouter);

export default router;
