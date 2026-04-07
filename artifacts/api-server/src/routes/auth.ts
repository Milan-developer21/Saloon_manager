import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, verifyToken, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, phone, password, role = "customer" } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: "Name, phone and password required" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Phone number already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name: name.trim(),
      phone: phone.trim(),
      password: hashed,
      role: role === "owner" ? "owner" : "customer",
    }).returning();
    const token = signToken(user.id, user.role);
    return res.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: "Phone and password required" });
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid phone or password" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid phone or password" });
    }
    const token = signToken(user.id, user.role);
    return res.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    return res.json({
      success: true,
      data: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
