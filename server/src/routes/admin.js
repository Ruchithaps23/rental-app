import { Router } from "express";
import prisma from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Guards EVERYTHING in this file: no need to repeat them on each route
router.use(requireAuth, requireAdmin);

// GET /admin/stats
router.get("/stats", async (req, res) => {
  // Promise.all runs these queries at the same time instead of one after another
  const [vehicles, customers, pending, revenue] = await Promise.all([
    prisma.vehicle.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } },
    }),
  ]);

  res.json({
    vehicles,
    customers,
    pending,
    revenue: Number(revenue._sum.totalPrice ?? 0),
  });
});

// GET /admin/customers
router.get("/customers", async (req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: { select: { bookings: true } }, // how many bookings each customer has
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(customers);
});

export default router;