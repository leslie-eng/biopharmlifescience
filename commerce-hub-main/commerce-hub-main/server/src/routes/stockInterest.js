import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler } from "../middleware.js";
import { newId, serializeRow } from "../utils.js";

const router = Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { product_id, email, client_id } = req.body;
    if (!product_id || !email?.trim()) {
      return res.status(400).json({ error: "Product and email required" });
    }

    const id = newId();
    try {
      await query(
        "INSERT INTO stock_interest (id, product_id, client_id, email, notified) VALUES (?, ?, ?, ?, 0)",
        [id, product_id, client_id ?? null, email.trim().toLowerCase()]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Already subscribed for this product" });
      }
      throw err;
    }

    const rows = await query(
      "SELECT id, product_id, client_id, email, notified, created_at FROM stock_interest WHERE id = ?",
      [id]
    );
    res.status(201).json(serializeRow(rows[0]));
  })
);

export default router;
