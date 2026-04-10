// Booking management routes for the Saloon Manager API
// Handles creating, viewing, and managing bookings

import { Router } from "express";
import { BookingModel, SaloonModel, TimeSlotModel, getNextSequence } from "@workspace/db";
import { verifyToken, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Helper function to parse ID parameters from request
function parseIdParam(value: string | string[]): number {
  return parseInt(Array.isArray(value) ? value[0] : value, 10);
}

// POST /bookings - Create a new booking request (customer only)
router.post("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { saloonId, slotId, customerName, customerPhone, service } = req.body;
    if (!saloonId || !slotId || !customerName || !customerPhone || !service) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }

    const slotIdNumber = parseInt(slotId, 10);
    const slot = await TimeSlotModel.findOne({ id: slotIdNumber }).exec();
    if (!slot) return res.status(404).json({ success: false, error: "Slot not found" });
    if (slot.isBlocked) return res.status(400).json({ success: false, error: "Slot is blocked" });
    if (parseInt(saloonId, 10) !== slot.saloonId) {
      return res.status(400).json({ success: false, error: "Slot does not belong to the selected saloon" });
    }

    // Check if slot is already accepted
    const acceptedBooking = await BookingModel.findOne({ slotId: slotIdNumber, status: "accepted" }).exec();
    if (acceptedBooking) {
      return res.status(400).json({ success: false, error: "Slot already booked" });
    }

    // Check if user already has a pending booking for this slot
    const existingMyBooking = await BookingModel.findOne({
      slotId: slotIdNumber,
      customerId: req.userId!,
      status: "pending",
    }).exec();
    if (existingMyBooking) {
      return res.status(400).json({ success: false, error: "You already have a pending request for this slot" });
    }

    const booking = await BookingModel.create({
      id: await getNextSequence("bookings"),
      saloonId: slot.saloonId,
      slotId: slotIdNumber,
      customerId: req.userId!,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      service,
      status: "pending",
    });

    return res.json({
      success: true,
      data: { ...booking.toObject(), slot: slot.toObject() },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /bookings/my - Get user's bookings with saloon and slot details
router.get("/my", verifyToken, async (req: AuthRequest, res) => {
  try {
    const bookings = await BookingModel.find({ customerId: req.userId! }).sort({ createdAt: 1 }).exec();

    const slotIds = [...new Set(bookings.map((booking) => booking.slotId))];
    const saloonIds = [...new Set(bookings.map((booking) => booking.saloonId))];

    const slots = slotIds.length > 0 ? await TimeSlotModel.find({ id: { $in: slotIds } }).exec() : [];
    const saloons = saloonIds.length > 0 ? await SaloonModel.find({ id: { $in: saloonIds } }).exec() : [];

    const slotMap = new Map(slots.map((slot) => [slot.id, slot.toObject()]));
    const saloonMap = new Map(saloons.map((saloon) => [saloon.id, saloon.toObject()]));

    return res.json({
      success: true,
      data: bookings.map((booking) => ({
        ...booking.toObject(),
        slot: slotMap.get(booking.slotId),
        saloon: saloonMap.get(booking.saloonId),
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /bookings/:id/respond - Accept or reject a booking (owner only)
router.patch("/:id/respond", verifyToken, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseIdParam(req.params.id);
    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return res.status(400).json({ success: false, error: "Status must be accepted or rejected" });
    }

    const booking = await BookingModel.findOne({ id: bookingId }).exec();
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });

    const saloon = await SaloonModel.findOne({ id: booking.saloonId }).exec();
    if (!saloon || saloon.ownerId !== req.userId) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const updated = await BookingModel.findOneAndUpdate(
      { id: bookingId },
      { status },
      { new: true },
    ).exec();

    // If accepted, reject all other pending bookings for this slot
    if (status === "accepted") {
      await BookingModel.updateMany(
        { slotId: booking.slotId, status: "pending" },
        { status: "rejected" },
      ).exec();
    }

    return res.json({ success: true, data: updated?.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /bookings/:id/cancel - Cancel a pending booking (customer only)
router.patch("/:id/cancel", verifyToken, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseIdParam(req.params.id);
    const booking = await BookingModel.findOne({ id: bookingId }).exec();
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
    if (booking.customerId !== req.userId) return res.status(403).json({ success: false, error: "Not authorized" });
    if (booking.status !== "pending") return res.status(400).json({ success: false, error: "Can only cancel pending bookings" });

    const updated = await BookingModel.findOneAndUpdate(
      { id: bookingId },
      { status: "cancelled" },
      { new: true },
    ).exec();

    return res.json({ success: true, data: updated?.toObject() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
