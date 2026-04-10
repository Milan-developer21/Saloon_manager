// Logger configuration for the Saloon Manager API
// Uses Pino for structured logging with pretty printing in development

import pino from "pino";

// Check if running in production environment
const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info", // Default log level
  redact: [
    "req.headers.authorization", // Redact sensitive auth headers
    "req.headers.cookie", // Redact cookies
    "res.headers['set-cookie']", // Redact set-cookie headers
  ],
  ...(isProduction
    ? {} // Production: JSON logs
    : {
        transport: {
          target: "pino-pretty", // Development: Pretty-printed logs
          options: { colorize: true },
        },
      }),
});
