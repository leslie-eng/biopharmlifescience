import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler, requireStaff } from "../middleware.js";
import { newId, serializeRow, serializeRows } from "../utils.js";

const router = Router();

router.get(
  "/",
  requireStaff,
  asyncHandler(async (_req, res) => {
    const rows = await query(
      "SELECT id, category, description, amount, occurred_on, created_at FROM expenses ORDER BY occurred_on DESC"
    );
    res.json(serializeRows(rows));
  })
);

router.post(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    const { category, description, amount, occurred_on } = req.body;
    if (!category || !amount || amount <= 0) {
      return res.status(400).json({ error: "Category and positive amount required" });
    }
    const id = newId();
    await query(
      "INSERT INTO expenses (id, category, description, amount, occurred_on) VALUES (?, ?, ?, ?, ?)",
      [id, category, description ?? null, Number(amount), occurred_on || new Date().toISOString().slice(0, 10)]
    );
    const rows = await query(
      "SELECT id, category, description, amount, occurred_on, created_at FROM expenses WHERE id = ?",
      [id]
    );
    res.status(201).json(serializeRow(rows[0]));
  })
);

router.delete(
  "/:id",
  requireStaff,
  asyncHandler(async (req, res) => {
    const result = await query("DELETE FROM expenses WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Expense not found" });
    res.json({ ok: true });
  })
);

export default router;
