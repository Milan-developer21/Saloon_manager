import { Router } from "express";
import { db, bookingsTable, timeSlotsTable, saloonsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { verifyToken, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { saloonId, slotId, customerName, customerPhone, service } = req.body;
    if (!saloonId || !slotId || !customerName || !customerPhone || !service) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }
    const [slot] = await db.select().from(timeSlotsTable).where(eq(timeSlotsTable.id, parseInt(slotId))).limit(1);
    if (!slot) return res.status(404).json({ success: false, error: "Slot not found" });
    if (slot.isBlocked) return res.status(400).json({ success: false, error: "Slot is blocked" });

    const acceptedBooking = await db.select().from(bookingsTable)
      .where(and(eq(bookingsTable.slotId, parseInt(slotId)), eq(bookingsTable.status, "accepted")))
      .limit(1);
    if (acceptedBooking.length > 0) {
      return res.status(400).json({ success: false, error: "Slot already booked" });
    }

    const existingMyBooking = await db.select().from(bookingsTable)
      .where(and(
        eq(bookingsTable.slotId, parseInt(slotId)),
        eq(bookingsTable.customerId, req.userId!),
        eq(bookingsTable.status, "pending")
      )).limit(1);
    if (existingMyBooking.length > 0) {
      return res.status(400).json({ success: false, error: "You already have a pending request for this slot" });
    }

    const [booking] = await db.insert(bookingsTable).values({
      saloonId: parseInt(saloonId),
      slotId: parseInt(slotId),
      customerId: req.userId!,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      service,
      status: "pending",
    }).returning();

    const bookingWithSlot = { ...booking, slot };
    return res.json({ success: true, data: bookingWithSlot });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/my", verifyToken, async (req: AuthRequest, res) => {
  try {
    const bookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.customerId, req.userId!))
      .orderBy(bookingsTable.createdAt);

    const slotIds = [...new Set(bookings.map((b) => b.slotId))];
    const saloonIds = [...new Set(bookings.map((b) => b.saloonId))];

    const slots = slotIds.length > 0
      ? await db.select().from(timeSlotsTable).where(inArray(timeSlotsTable.id, slotIds))
      : [];
    const saloons = saloonIds.length > 0
      ? await db.select().from(saloonsTable).where(inArray(saloonsTable.id, saloonIds))
      : [];

    const slotMap = new Map(slots.map((s) => [s.id, s]));
    const saloonMap = new Map(saloons.map((s) => [s.id, s]));

    const enriched = bookings.map((b) => ({
      ...b,
      slot: slotMap.get(b.slotId),
      saloon: saloonMap.get(b.saloonId),
    }));

    return res.json({ success: true, data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/:id/respond", verifyToken, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return res.status(400).json({ success: false, error: "Status must be accepted or rejected" });
    }
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });

    const [saloon] = await db.select().from(saloonsTable).where(eq(saloonsTable.id, booking.saloonId)).limit(1);
    if (!saloon || saloon.ownerId !== req.userId) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const [updated] = await db.update(bookingsTable).set({ status }).where(eq(bookingsTable.id, bookingId)).returning();

    if (status === "accepted") {
      await db.update(bookingsTable).set({ status: "rejected" })
        .where(and(
          eq(bookingsTable.slotId, booking.slotId),
          eq(bookingsTable.status, "pending"),
        ));
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/:id/cancel", verifyToken, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
    if (booking.customerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });
    if (booking.status !== "pending") return res.status(400).json({ success: false, error: "Can only cancel pending bookings" });
    const [updated] = await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, bookingId)).returning();
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
