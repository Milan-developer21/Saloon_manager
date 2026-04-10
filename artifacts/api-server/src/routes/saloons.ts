// Saloon management routes for the Saloon Manager API
// Handles CRUD operations for saloons, time slots, and related functionality

import { Router } from "express";
import { BookingModel, SaloonModel, TimeSlotModel, getNextSequence, getNextSequenceRange } from "@workspace/db";
import { verifyToken, requireOwner, type AuthRequest } from "../middlewares/auth.js";
import { getLocalDateWithOffset } from "../lib/date.js";

const router = Router();

// Helper function to parse ID parameters from request
function parseIdParam(value: string | string[]): number {
  return parseInt(Array.isArray(value) ? value[0] : value, 10);
}

// Helper function to get date string with offset
function getDateStr(offset: number) {
  return getLocalDateWithOffset(offset);
}

// Generate time slots for a specific day based on saloon hours and duration
function generateSlotsForDay(saloonId: number, date: string, openTime: string, closeTime: string, duration: number) {
  const slots: Array<{ saloonId: number; date: string; time: string; isBlocked: boolean }> = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let current = openH * 60 + openM;
  const close = closeH * 60 + closeM;

  while (current + duration <= close) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push({
      saloonId,
      date,
      time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      isBlocked: false,
    });
    current += duration;
  }

  return slots;
}

// GET /saloons - List all saloons
router.get("/", async (_req, res) => {
  try {
    const saloons = await SaloonModel.find().sort({ createdAt: 1 }).exec();
    return res.json({ success: true, data: saloons.map((saloon) => saloon.toObject()) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /saloons/:id - Get specific saloon details
router.get("/:id", async (req, res) => {
  try {
    const saloon = await SaloonModel.findOne({ id: parseIdParam(req.params.id) }).exec();
    if (!saloon) return res.status(404).json({ success: false, error: "Saloon not found" });
    return res.json({ success: true, data: saloon.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /saloons/:id/slots - Get time slots for a saloon on a specific date
router.get("/:id/slots", async (req, res) => {
  try {
    const saloonId = parseIdParam(req.params.id);
    const date = (req.query.date as string) || getDateStr(0);
    const slots = await TimeSlotModel.find({ saloonId, date }).sort({ time: 1 }).exec();
    const bookings = await BookingModel.find({ saloonId, slotId: { $in: slots.map((slot) => slot.id) } }).exec();

    const todayStr = getDateStr(0);
    let nowMinutes = -1;
    if (date === todayStr) {
      const now = new Date();
      nowMinutes = now.getHours() * 60 + now.getMinutes();
    }

    const slotsWithStatus = slots.map((slot) => {
      const slotBookings = bookings.filter((booking) => booking.slotId === slot.id);
      let status = "available";
      if (slot.isBlocked) status = "blocked";
      else if (slotBookings.some((booking) => booking.status === "accepted")) status = "booked";
      else if (slotBookings.some((booking) => booking.status === "pending")) status = "pending";

      if (status === "available" && nowMinutes >= 0) {
        const [h, m] = slot.time.split(":").map(Number);
        if (h * 60 + m < nowMinutes + 30) status = "past";
      }

      return { ...slot.toObject(), status };
    });

    return res.json({ success: true, data: slotsWithStatus });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /saloons - Create a new saloon (owner only)
router.post("/", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const existing = await SaloonModel.findOne({ ownerId: req.userId! }).exec();
    if (existing) {
      return res.status(409).json({ success: false, error: "You already have a registered saloon" });
    }

    const { name, ownerName, phone, address, city, description, services, openTime, closeTime, isOpen, slotDuration } = req.body;
    if (!name || !ownerName || !phone || !city) {
      return res.status(400).json({ success: false, error: "Name, owner name, phone and city required" });
    }

    const saloon = await SaloonModel.create({
      id: await getNextSequence("saloons"),
      ownerId: req.userId!,
      name,
      ownerName,
      phone,
      address: address || "",
      city,
      description: description || "",
      services: Array.isArray(services) ? services : [],
      openTime: openTime || "09:00",
      closeTime: closeTime || "20:00",
      isOpen: isOpen !== false,
      slotDuration: slotDuration || 30,
    });

    // Generate time slots for the next 7 days
    const allSlots = [];
    for (let i = 0; i < 7; i++) {
      allSlots.push(...generateSlotsForDay(saloon.id, getDateStr(i), saloon.openTime, saloon.closeTime, saloon.slotDuration));
    }

    if (allSlots.length > 0) {
      const ids = await getNextSequenceRange("timeSlots", allSlots.length);
      await TimeSlotModel.insertMany(allSlots.map((slot, index) => ({ id: ids[index], ...slot })));
    }

    return res.json({ success: true, data: saloon.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /saloons/:id - Update saloon details (owner only)
router.put("/:id", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const saloon = await SaloonModel.findOne({ id }).exec();
    if (!saloon) return res.status(404).json({ success: false, error: "Saloon not found" });
    if (saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not your saloon" });

    const { name, ownerName, phone, address, city, description, services, openTime, closeTime, isOpen, slotDuration } = req.body;
    const updated = await SaloonModel.findOneAndUpdate(
      { id },
      {
        name: name || saloon.name,
        ownerName: ownerName || saloon.ownerName,
        phone: phone || saloon.phone,
        address: address ?? saloon.address,
        city: city || saloon.city,
        description: description ?? saloon.description,
        services: Array.isArray(services) ? services : saloon.services,
        openTime: openTime || saloon.openTime,
        closeTime: closeTime || saloon.closeTime,
        isOpen: isOpen !== undefined ? isOpen : saloon.isOpen,
        slotDuration: slotDuration || saloon.slotDuration,
      },
      { new: true },
    ).exec();

    return res.json({ success: true, data: updated?.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /saloons/:id/toggle-open - Toggle saloon open/closed status (owner only)
router.patch("/:id/toggle-open", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const saloon = await SaloonModel.findOne({ id }).exec();
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });

    const updated = await SaloonModel.findOneAndUpdate(
      { id },
      { isOpen: !saloon.isOpen },
      { new: true },
    ).exec();

    return res.json({ success: true, data: updated?.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /saloons/:id/slots/generate - Generate time slots for the next 7 days (owner only)
router.post("/:id/slots/generate", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const saloonId = parseIdParam(req.params.id);
    const saloon = await SaloonModel.findOne({ id: saloonId }).exec();
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });

    for (let i = 0; i < 7; i++) {
      const date = getDateStr(i);
      const existingSlots = await TimeSlotModel.exists({ saloonId, date });
      if (!existingSlots) {
        const newSlots = generateSlotsForDay(saloonId, date, saloon.openTime, saloon.closeTime, saloon.slotDuration);
        if (newSlots.length > 0) {
          const ids = await getNextSequenceRange("timeSlots", newSlots.length);
          await TimeSlotModel.insertMany(newSlots.map((slot, index) => ({ id: ids[index], ...slot })));
        }
      }
    }

    return res.json({ success: true, data: { message: "Slots generated for next 7 days" } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /saloons/:id/bookings - Get all bookings for a saloon (owner only)
router.get("/:id/bookings", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const saloonId = parseIdParam(req.params.id);
    const saloon = await SaloonModel.findOne({ id: saloonId }).exec();
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });

    const bookings = await BookingModel.find({ saloonId }).sort({ createdAt: 1 }).exec();
    const slotIds = [...new Set(bookings.map((booking) => booking.slotId))];
    const slots = slotIds.length > 0 ? await TimeSlotModel.find({ id: { $in: slotIds } }).exec() : [];
    const slotMap = new Map(slots.map((slot) => [slot.id, slot.toObject()]));

    return res.json({
      success: true,
      data: bookings.map((booking) => ({ ...booking.toObject(), slot: slotMap.get(booking.slotId) })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /saloons/:id/slots/:slotId/block - Toggle slot blocked status (owner only)
router.patch("/:id/slots/:slotId/block", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const saloonId = parseIdParam(req.params.id);
    const slotId = parseIdParam(req.params.slotId);
    const saloon = await SaloonModel.findOne({ id: saloonId }).exec();
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });

    const slot = await TimeSlotModel.findOne({ id: slotId }).exec();
    if (!slot) return res.status(404).json({ success: false, error: "Slot not found" });
    if (slot.saloonId !== saloonId) {
      return res.status(404).json({ success: false, error: "Slot not found for this saloon" });
    }

    const updated = await TimeSlotModel.findOneAndUpdate(
      { id: slotId },
      { isBlocked: !slot.isBlocked },
      { new: true },
    ).exec();

    return res.json({ success: true, data: updated?.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
