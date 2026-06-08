import { Router } from "express";
import { pool, query } from "../db.js";
import { asyncHandler, loadUserRoles, optionalAuth, requireAuth, requireStaff } from "../middleware.js";
import { generateOrderNumber, newId, serializeRow, serializeRows } from "../utils.js";

const router = Router();

const ORDER_FIELDS =
  "id, order_number, client_id, customer_name, customer_email, customer_phone, status, payment_method, subtotal, total, mpesa_receipt, notes, created_at, updated_at";

router.get(
  "/",
  requireStaff,
  asyncHandler(async (_req, res) => {
    const rows = await query(`SELECT ${ORDER_FIELDS} FROM orders ORDER BY created_at DESC`);
    res.json(serializeRows(rows));
  })
);

router.get(
  "/:id/items",
  requireStaff,
  asyncHandler(async (req, res) => {
    const rows = await query(
      "SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total, created_at FROM order_items WHERE order_id = ?",
      [req.params.id]
    );
    res.json(serializeRows(rows));
  })
);

router.patch(
  "/:id",
  requireStaff,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });
    await query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    const rows = await query(`SELECT ${ORDER_FIELDS} FROM orders WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Order not found" });
    res.json(serializeRow(rows[0]));
  })
);

router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { order, items, decrement_stock: decrementStock } = req.body;
    if (!order || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order and items required" });
    }

    const status = order.status || "pending";
    let roles = [];
    if (req.userId) roles = await loadUserRoles(req.userId);
    const isStaff = roles.includes("admin") || roles.includes("staff");

    if (status !== "pending" && !isStaff) {
      return res.status(403).json({ error: "Only staff can create non-pending orders" });
    }
    if (status === "pending" && !req.userId) {
      return res.status(401).json({ error: "Sign in required to place an order" });
    }

    const customerName = order.customer_name?.trim();
    if (!customerName) return res.status(400).json({ error: "Customer name required" });

    const subtotal = Number(order.subtotal ?? order.total ?? 0);
    const total = Number(order.total ?? subtotal);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const orderId = newId();
      const orderNumber = generateOrderNumber();
      await conn.execute(
        `INSERT INTO orders (id, order_number, client_id, customer_name, customer_email, customer_phone, status, payment_method, subtotal, total, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          order.client_id ?? null,
          customerName,
          order.customer_email ?? null,
          order.customer_phone ?? null,
          status,
          order.payment_method ?? "mpesa",
          subtotal,
          total,
          order.notes ?? null,
        ]
      );

      for (const line of items) {
        const itemId = newId();
        await conn.execute(
          `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            orderId,
            line.product_id ?? null,
            line.product_name,
            Number(line.unit_price),
            Number(line.quantity),
            Number(line.line_total),
          ]
        );

        if (decrementStock && line.product_id) {
          const [stockRows] = await conn.execute("SELECT stock FROM products WHERE id = ? FOR UPDATE", [
            line.product_id,
          ]);
          if (!stockRows.length) throw Object.assign(new Error("Product not found"), { status: 400 });
          const newStock = stockRows[0].stock - Number(line.quantity);
          if (newStock < 0) {
            throw Object.assign(new Error(`Insufficient stock for ${line.product_name}`), { status: 400 });
          }
          await conn.execute("UPDATE products SET stock = ? WHERE id = ?", [newStock, line.product_id]);
        }
      }

      await conn.commit();
      const [rows] = await pool.execute(`SELECT ${ORDER_FIELDS} FROM orders WHERE id = ?`, [orderId]);
      res.status(201).json(serializeRow(rows[0]));
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  })
);

export default router;
