import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler, loadUserRoles, optionalAuth, requireStaff } from "../middleware.js";
import { newId, serializeRow, serializeRows, slugify } from "../utils.js";

const router = Router();

const PRODUCT_FIELDS =
  "id, name, slug, description, category, price, cost, stock, unit, image_url, is_active, created_at, updated_at";

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const staff = req.query.staff === "true";
    if (staff) {
      const roles = req.userId ? await loadUserRoles(req.userId) : [];
      if (!roles.includes("admin") && !roles.includes("staff")) {
        return res.status(403).json({ error: "Staff access required" });
      }
    }
    const activeOnly = req.query.active === "true" || !staff;

    let sql = `SELECT ${PRODUCT_FIELDS} FROM products`;
    const params = [];
    if (activeOnly) {
      sql += " WHERE is_active = 1";
    }
    sql += " ORDER BY created_at DESC";

    const rows = await query(sql, params);
    res.json(serializeRows(rows));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const rows = await query(`SELECT ${PRODUCT_FIELDS} FROM products WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(serializeRow(rows[0]));
  })
);

router.post(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (!body.name?.trim()) return res.status(400).json({ error: "Name required" });

    const id = newId();
    const slug = body.slug?.trim() || slugify(body.name);
    await query(
      `INSERT INTO products (id, name, slug, description, category, price, cost, stock, unit, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name.trim(),
        slug,
        body.description ?? null,
        body.category ?? null,
        Number(body.price) || 0,
        Number(body.cost) || 0,
        Number(body.stock) || 0,
        body.unit ?? "unit",
        body.image_url ?? null,
        body.is_active === false ? 0 : 1,
      ]
    );
    const rows = await query(`SELECT ${PRODUCT_FIELDS} FROM products WHERE id = ?`, [id]);
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

    const allowed = [
      "name",
      "slug",
      "description",
      "category",
      "price",
      "cost",
      "stock",
      "unit",
      "image_url",
      "is_active",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === "is_active") params.push(body[key] ? 1 : 0);
        else if (key === "price" || key === "cost" || key === "stock") params.push(Number(body[key]));
        else params.push(body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: "No fields to update" });

    params.push(req.params.id);
    await query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, params);

    const rows = await query(`SELECT ${PRODUCT_FIELDS} FROM products WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(serializeRow(rows[0]));
  })
);

router.delete(
  "/:id",
  requireStaff,
  asyncHandler(async (req, res) => {
    const result = await query("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ ok: true });
  })
);

export default router;
