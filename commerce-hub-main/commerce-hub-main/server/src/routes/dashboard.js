import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler, requireStaff } from "../middleware.js";
import { serializeRows } from "../utils.js";

const router = Router();

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"];

router.get(
  "/overview",
  requireStaff,
  asyncHandler(async (_req, res) => {
    const orders = await query(
      "SELECT id, order_number, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC"
    );
    const clientCount = await query("SELECT COUNT(*) AS c FROM clients");
    const products = await query("SELECT stock FROM products");

    const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
    const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);

    res.json({
      stats: {
        revenue,
        orders: orders.length,
        clients: Number(clientCount[0].c),
        products: products.length,
        lowStock: products.filter((p) => p.stock <= 5).length,
      },
      recentOrders: serializeRows(orders.slice(0, 5)),
    });
  })
);

router.get(
  "/reports",
  requireStaff,
  asyncHandler(async (req, res) => {
    const since = req.query.since || new Date(Date.now() - 30 * 86400000).toISOString();

    const orders = await query(
      "SELECT total, status, created_at FROM orders WHERE created_at >= ?",
      [since.slice(0, 19).replace("T", " ")]
    );
    const items = await query(
      "SELECT oi.product_name, oi.line_total, oi.quantity FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id WHERE o.created_at >= ?",
      [since.slice(0, 19).replace("T", " ")]
    );

    res.json({
      orders: serializeRows(orders),
      order_items: serializeRows(items),
    });
  })
);

export default router;
