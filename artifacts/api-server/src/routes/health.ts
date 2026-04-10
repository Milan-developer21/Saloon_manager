// Health check routes for the Saloon Manager API
// Provides endpoints for monitoring service health

import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /healthz - Health check endpoint
// Returns a simple status response to verify the service is running
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
