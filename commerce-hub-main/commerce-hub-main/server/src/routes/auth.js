import { Router } from "express";
import { query } from "../db.js";
import { comparePassword, hashPassword, signToken } from "../auth.js";
import { asyncHandler, loadUserRoles, requireAuth } from "../middleware.js";
import { newId, serializeRow } from "../utils.js";

const router = Router();

async function fetchUserProfile(userId) {
  const rows = await query(
    `SELECT u.id, u.email, p.full_name
     FROM users u
     LEFT JOIN profiles p ON p.id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    user_metadata: { full_name: row.full_name || "" },
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body;
    if (!email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: "Valid email and password (min 6 chars) required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const userId = newId();
    const passwordHash = await hashPassword(password);
    const userCountRows = await query("SELECT COUNT(*) AS c FROM users");
    const isFirstUser = Number(userCountRows[0].c) === 0;
    const role = isFirstUser ? "admin" : "customer";

    await query(
      "INSERT INTO users (id, email, password_hash, email_confirmed_at) VALUES (?, ?, ?, NOW())",
      [userId, normalizedEmail, passwordHash]
    );
    await query("INSERT INTO profiles (id, full_name, email) VALUES (?, ?, ?)", [
      userId,
      fullName?.trim() || "",
      normalizedEmail,
    ]);
    await query("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)", [newId(), userId, role]);

    const token = signToken(userId);
    const user = await fetchUserProfile(userId);
    const roles = await loadUserRoles(userId);

    res.status(201).json({ token, user, roles });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const rows = await query("SELECT id, password_hash FROM users WHERE email = ?", [
      email.trim().toLowerCase(),
    ]);
    if (!rows.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await comparePassword(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const userId = rows[0].id;
    const token = signToken(userId);
    const user = await fetchUserProfile(userId);
    const roles = await loadUserRoles(userId);

    res.json({ token, user, roles });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await fetchUserProfile(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const roles = await loadUserRoles(req.userId);
    res.json({ user, roles });
  })
);

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
