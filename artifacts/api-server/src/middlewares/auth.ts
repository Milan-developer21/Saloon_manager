import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "mysaloon-secret-key";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

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

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "owner") {
    res.status(403).json({ success: false, error: "Owner access required" });
    return;
  }
  next();
  return;
}

export function signToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" });
}
