import jwt from "jsonwebtoken";

// Checkpoint 1: is the person logged in?
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Please log in first" });
  }

  try {
    // Verify the signature; if valid, remember who this is
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // let the request continue to the route
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Checkpoint 2: is the person an admin?
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admins only" });
  }
  next();
}