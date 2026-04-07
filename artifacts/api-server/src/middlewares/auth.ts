import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "mysaloon-secret-key";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "owner") {
    return res.status(403).json({ success: false, error: "Owner access required" });
  }
  next();
}

export function signToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" });
}
