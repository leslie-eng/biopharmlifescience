import { query } from "./db.js";
import { verifyToken } from "./auth.js";

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export async function loadUserRoles(userId) {
  const rows = await query("SELECT role FROM user_roles WHERE user_id = ?", [userId]);
  return rows.map((r) => r.role);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
  } catch {
    /* ignore invalid token for optional routes */
  }
  next();
}

export function requireStaff(req, res, next) {
  requireAuth(req, res, async () => {
    try {
      const roles = await loadUserRoles(req.userId);
      if (!roles.includes("admin") && !roles.includes("staff")) {
        return res.status(403).json({ error: "Staff access required" });
      }
      req.roles = roles;
      next();
    } catch (err) {
      next(err);
    }
  });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}
