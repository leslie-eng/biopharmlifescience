import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler, requireStaff } from "../middleware.js";
import { newId, serializeRow, serializeRows } from "../utils.js";

const router = Router();

const FIELDS =
  "id, full_name, email, phone, address, notes, notify_on_restock, created_at, updated_at";

router.get(
  "/",
  requireStaff,
  asyncHandler(async (_req, res) => {
    const rows = await query(`SELECT ${FIELDS} FROM clients ORDER BY created_at DESC`);
    res.json(serializeRows(rows));
  })
);

router.post(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (!body.full_name?.trim()) return res.status(400).json({ error: "Full name required" });

    const id = newId();
    await query(
      `INSERT INTO clients (id, full_name, email, phone, address, notes, notify_on_restock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.full_name.trim(),
        body.email ?? null,
        body.phone ?? null,
        body.address ?? null,
        body.notes ?? null,
        body.notify_on_restock === false ? 0 : 1,
      ]
    );
    const rows = await query(`SELECT ${FIELDS} FROM clients WHERE id = ?`, [id]);
    res.status(201).json(serializeRow(rows[0]));
  })
);

router.patch(
  "/:id",
  requireStaff,
  asyncHandler(async (req, res) => {
    const body = req.body;
    const fields = [];
    const params = [];
    for (const key of ["full_name", "email", "phone", "address", "notes", "notify_on_restock"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === "notify_on_restock" ? (body[key] ? 1 : 0) : body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    await query(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`, params);
    const rows = await query(`SELECT ${FIELDS} FROM clients WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Client not found" });
    res.json(serializeRow(rows[0]));
  })
);

router.delete(
  "/:id",
  requireStaff,
  asyncHandler(async (req, res) => {
    const result = await query("DELETE FROM clients WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Client not found" });
    res.json({ ok: true });
  })
);

export default router;
