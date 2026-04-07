import { Router } from "express";
import { db, saloonsTable, timeSlotsTable, bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken, requireOwner, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function generateSlotsForDay(saloonId: number, date: string, openTime: string, closeTime: string, duration: number) {
  const slots = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let current = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  while (current + duration <= close) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    slots.push({ saloonId, date, time, isBlocked: false });
    current += duration;
  }
  return slots;
}

router.get("/", async (_req, res) => {
  try {
    const saloons = await db.select().from(saloonsTable).orderBy(saloonsTable.createdAt);
    return res.json({ success: true, data: saloons });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, id)).limit(1);
    if (!saloon) return res.status(404).json({ success: false, error: "Saloon not found" });
    return res.json({ success: true, data: saloon });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id/slots", async (req, res) => {
  try {
    const saloonId = parseInt(req.params.id);
    const date = req.query.date as string || getDateStr(0);
    const slots = await db.select().from(timeSlotsTable)
      .where(and(eq(timeSlotsTable.saloonId, saloonId), eq(timeSlotsTable.date, date)))
      .orderBy(timeSlotsTable.time);

    const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.saloonId, saloonId));

    // For today: compute current time in minutes to mark past/too-soon slots
    const todayStr = getDateStr(0);
    let nowMinutes = -1;
    if (date === todayStr) {
      const now = new Date();
      nowMinutes = now.getHours() * 60 + now.getMinutes();
    }

    const slotsWithStatus = slots.map((slot) => {
      const slotBookings = bookings.filter((b) => b.slotId === slot.id);
      let status = "available";
      if (slot.isBlocked) status = "blocked";
      else if (slotBookings.some((b) => b.status === "accepted")) status = "booked";
      else if (slotBookings.some((b) => b.status === "pending")) status = "pending";

      // Mark available today-slots that are past or within the next 30 min as "past"
      if (status === "available" && nowMinutes >= 0) {
        const [h, m] = slot.time.split(":").map(Number);
        const slotMinutes = h * 60 + m;
        if (slotMinutes < nowMinutes + 30) status = "past";
      }

      return { ...slot, status };
    });

    return res.json({ success: true, data: slotsWithStatus });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const existing = await db.select().from(saloonsTable).where(eq(saloonsTable.ownerId, req.userId!)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "You already have a registered saloon" });
    }
    const { name, ownerName, phone, address, city, description, services, openTime, closeTime, isOpen, slotDuration } = req.body;
    if (!name || !ownerName || !phone || !city) {
      return res.status(400).json({ success: false, error: "Name, owner name, phone and city required" });
    }
    const [saloon] = await db.insert(saloonsTable).values({
      ownerId: req.userId!,
      name, ownerName, phone,
      address: address || "",
      city,
      description: description || "",
      services: Array.isArray(services) ? services : [],
      openTime: openTime || "09:00",
      closeTime: closeTime || "20:00",
      isOpen: isOpen !== false,
      slotDuration: slotDuration || 30,
    }).returning();

    const allSlots = [];
    for (let i = 0; i < 7; i++) {
      allSlots.push(...generateSlotsForDay(saloon.id, getDateStr(i), saloon.openTime, saloon.closeTime, saloon.slotDuration));
    }
    if (allSlots.length > 0) {
      await db.insert(timeSlotsTable).values(allSlots);
    }
    return res.json({ success: true, data: saloon });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, id)).limit(1);
    if (!saloon) return res.status(404).json({ success: false, error: "Saloon not found" });
    if (saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not your saloon" });

    const { name, ownerName, phone, address, city, description, services, openTime, closeTime, isOpen, slotDuration } = req.body;
    const [updated] = await db.update(saloonsTable).set({
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
    }).where(eq(saloonsTable.id, id)).returning();
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/:id/toggle-open", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, id)).limit(1);
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });
    const [updated] = await db.update(saloonsTable).set({ isOpen: !saloon.isOpen }).where(eq(saloonsTable.id, id)).returning();
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:id/slots/generate", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const saloonId = parseInt(req.params.id);
    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, saloonId)).limit(1);
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });

    for (let i = 0; i < 7; i++) {
      const date = getDateStr(i);
      const existingSlots = await db.select({ id: timeSlotsTable.id })
        .from(timeSlotsTable)
        .where(and(eq(timeSlotsTable.saloonId, saloonId), eq(timeSlotsTable.date, date)));
      if (existingSlots.length === 0) {
        const newSlots = generateSlotsForDay(saloonId, date, saloon.openTime, saloon.closeTime, saloon.slotDuration);
        if (newSlots.length > 0) await db.insert(timeSlotsTable).values(newSlots);
      }
    }
    return res.json({ success: true, data: { message: "Slots generated for next 7 days" } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id/bookings", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const saloonId = parseInt(req.params.id);
    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, saloonId)).limit(1);
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });

    const bookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.saloonId, saloonId))
      .orderBy(bookingsTable.createdAt);

    const slotIds = [...new Set(bookings.map((b) => b.slotId))];
    const slots = slotIds.length > 0
      ? await db.select().from(timeSlotsTable).where(
          timeSlotsTable.id.in ? timeSlotsTable.id.in(slotIds) : eq(timeSlotsTable.id, slotIds[0])
        )
      : [];

    const slotMap = new Map(slots.map((s) => [s.id, s]));
    const enriched = bookings.map((b) => ({ ...b, slot: slotMap.get(b.slotId) }));
    return res.json({ success: true, data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/:id/slots/:slotId/block", verifyToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const saloonId = parseInt(req.params.id);
    const slotId = parseInt(req.params.slotId);
    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, saloonId)).limit(1);
    if (!saloon || saloon.ownerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });
    const [slot] = await db.select().from(timeSlotsTable).where(eq(timeSlotsTable.id, slotId)).limit(1);
    if (!slot) return res.status(404).json({ success: false, error: "Slot not found" });
    const [updated] = await db.update(timeSlotsTable).set({ isBlocked: !slot.isBlocked }).where(eq(timeSlotsTable.id, slotId)).returning();
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
