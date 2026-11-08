import { Router } from "express";
import prisma from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Bookings in these states block the vehicle for those dates
const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"];

// ---------- PUBLIC ROUTES ----------

// GET /vehicles?type=SUV&from=2026-11-01&to=2026-11-05
router.get("/", async (req, res) => {
  const { type, from, to } = req.query;

  const where = { status: "AVAILABLE" };
  if (type) where.type = type;

  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ error: "Invalid dates (to must be after from)" });
    }
    // Keep only vehicles with NO overlapping booking
    where.bookings = {
      none: {
        status: { in: BLOCKING_STATUSES },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    };
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { pricePerDay: "asc" },
  });
  res.json(vehicles);
});

// ---------- ADMIN ROUTES ----------
// (declared before "/:id" so "admin" is never mistaken for an id)

// GET /vehicles/admin/all : every vehicle, including ones in maintenance
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { id: "asc" } });
  res.json(vehicles);
});

// GET /vehicles/:id : one vehicle
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid vehicle id" });
  }
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  res.json(vehicle);
});

// POST /vehicles : add a vehicle
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { make, model, type, seats, transmission, fuel, pricePerDay, imageUrl } = req.body;

  if (!make || !model || !type || !seats || !transmission || !fuel || !pricePerDay) {
    return res.status(400).json({ error: "Missing required vehicle fields" });
  }
  if (Number(pricePerDay) <= 0 || Number(seats) <= 0) {
    return res.status(400).json({ error: "Price and seats must be positive numbers" });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      make,
      model,
      type,
      seats: Number(seats),
      transmission,
      fuel,
      pricePerDay: Number(pricePerDay),
      imageUrl,
    },
  });
  res.status(201).json(vehicle);
});

// PATCH /vehicles/:id : change only the fields you send
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid vehicle id" });
  }

  // Only allow these fields to be changed (ignore anything else)
  const allowed = ["make", "model", "type", "seats", "transmission", "fuel", "pricePerDay", "imageUrl", "status"];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  if (data.seats !== undefined) data.seats = Number(data.seats);
  if (data.pricePerDay !== undefined) data.pricePerDay = Number(data.pricePerDay);

  try {
    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    res.json(vehicle);
  } catch {
    res.status(404).json({ error: "Vehicle not found or invalid data" });
  }
});

// DELETE /vehicles/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid vehicle id" });
  }

  // Never delete a vehicle that has booking history
  const bookingCount = await prisma.booking.count({ where: { vehicleId: id } });
  if (bookingCount > 0) {
    return res.status(409).json({
      error: "This vehicle has bookings. Set its status to MAINTENANCE instead.",
    });
  }

  try {
    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: "Vehicle deleted" });
  } catch {
    res.status(404).json({ error: "Vehicle not found" });
  }
});

export default router;