import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"];
const ALL_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------- CUSTOMER ROUTES ----------

// POST /bookings : create a booking
router.post("/", requireAuth, async (req, res) => {
  const { vehicleId, startDate, endDate } = req.body;

  const vId = Number(vehicleId);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!Number.isInteger(vId) || isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: "vehicleId, startDate and endDate are required" });
  }
  if (end <= start) {
    return res.status(400).json({ error: "Return date must be after start date" });
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (start < today) {
    return res.status(400).json({ error: "Start date cannot be in the past" });
  }

  try {
    // Everything inside runs as ONE all-or-nothing unit
    const booking = await prisma.$transaction(
      async (tx) => {
        const vehicle = await tx.vehicle.findUnique({ where: { id: vId } });
        if (!vehicle || vehicle.status !== "AVAILABLE") {
          throw new Error("VEHICLE_UNAVAILABLE");
        }

        const clash = await tx.booking.findFirst({
          where: {
            vehicleId: vId,
            status: { in: BLOCKING_STATUSES },
            startDate: { lt: end },
            endDate: { gt: start },
          },
        });
        if (clash) throw new Error("DATES_TAKEN");

        // The server calculates the price, never the browser
        const days = Math.ceil((end - start) / MS_PER_DAY);
        const totalPrice = days * Number(vehicle.pricePerDay);

        return tx.booking.create({
          data: {
            userId: req.user.id,
            vehicleId: vId,
            startDate: start,
            endDate: end,
            totalPrice,
          },
          include: { vehicle: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.status(201).json(booking);
  } catch (err) {
    if (err.message === "VEHICLE_UNAVAILABLE") {
      return res.status(404).json({ error: "Vehicle not found or not available" });
    }
    if (err.message === "DATES_TAKEN") {
      return res.status(409).json({ error: "This vehicle is already booked for those dates" });
    }
    if (err.code === "P2034") {
      // Two people tried to book at the same moment; the database rejected one
      return res.status(409).json({ error: "Someone just booked this vehicle. Please try again." });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /bookings/mine : my own bookings
router.get("/mine", requireAuth, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { vehicle: true },
    orderBy: { startDate: "desc" },
  });
  res.json(bookings);
});

// PATCH /bookings/:id/cancel : cancel (owner or admin)
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid booking id" });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const isOwner = booking.userId === req.user.id;
  if (!isOwner && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "You can only cancel your own bookings" });
  }
  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    return res.status(409).json({ error: `A ${booking.status} booking cannot be cancelled` });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
});

// ---------- ADMIN ROUTES ----------

// GET /bookings/admin/all : every booking, with customer and vehicle
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      vehicle: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
});

// PATCH /bookings/:id/status : confirm, activate, complete...
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid booking id" });
  }
  if (!ALL_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ALL_STATUSES.join(", ")}` });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Reviving a booking? Make sure its dates are still free
  if (BLOCKING_STATUSES.includes(status)) {
    const clash = await prisma.booking.findFirst({
      where: {
        id: { not: id }, // ignore the booking itself
        vehicleId: booking.vehicleId,
        status: { in: BLOCKING_STATUSES },
        startDate: { lt: booking.endDate },
        endDate: { gt: booking.startDate },
      },
    });
    if (clash) {
      return res.status(409).json({ error: "Another active booking overlaps these dates" });
    }
  }

  const updated = await prisma.booking.update({ where: { id }, data: { status } });
  res.json(updated);
});

export default router;