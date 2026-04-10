// Authentication routes for the Saloon Manager API
// Handles user registration, login, and profile retrieval

import { Router } from "express";
import bcrypt from "bcrypt";
import { UserModel, getNextSequence, type User } from "@workspace/db";
import { signToken, verifyToken, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Helper function to return public user data (without password)
function toPublicUser(user: User) {
  return { id: user.id, name: user.name, phone: user.phone, role: user.role };
}

// POST /auth/register - Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password, role = "customer" } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: "Name, phone and password required" });
    }

    const normalizedPhone = phone.trim();
    const existing = await UserModel.findOne({ phone: normalizedPhone }).exec();
    if (existing) {
      return res.status(409).json({ success: false, error: "Phone number already registered" });
    }

    // Create new user with auto-generated ID
    const user = await UserModel.create({
      id: await getNextSequence("users"),
      name: name.trim(),
      phone: normalizedPhone,
      password: await bcrypt.hash(password, 10), // Hash password with salt rounds
      role: role === "owner" ? "owner" : "customer",
    });

    const token = signToken(user.id, user.role);
    return res.json({
      success: true,
      data: { token, user: toPublicUser(user.toObject()) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /auth/login - Authenticate user and return token
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: "Phone and password required" });
    }

    const user = await UserModel.findOne({ phone: phone.trim() }).exec();
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
      data: { token, user: toPublicUser(user.toObject()) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /auth/me - Get current user profile (requires authentication)
router.get("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = await UserModel.findOne({ id: req.userId! }).exec();
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      data: toPublicUser(user.toObject()),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
