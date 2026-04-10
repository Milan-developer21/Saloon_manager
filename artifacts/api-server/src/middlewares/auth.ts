// Authentication middleware for the Saloon Manager API
// Handles JWT token verification and role-based access control

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT secret key from environment or default
const JWT_SECRET = process.env.SESSION_SECRET || "mysaloon-secret-key";

// Extended Request interface with user authentication data
export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// Middleware to verify JWT token from Authorization header
export function verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
    return;
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }
}

// Middleware to ensure user has owner role
export function requireOwner(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "owner") {
    res.status(403).json({ success: false, error: "Owner access required" });
    return;
  }
  next();
  return;
}

// Generate JWT token for authenticated user
export function signToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" });
}
