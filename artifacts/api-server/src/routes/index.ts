import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import saloonsRouter from "./saloons.js";
import bookingsRouter from "./bookings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/saloons", saloonsRouter);
router.use("/bookings", bookingsRouter);

export default router;
