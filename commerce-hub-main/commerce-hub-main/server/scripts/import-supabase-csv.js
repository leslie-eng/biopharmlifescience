/**
 * Import Supabase table exports (CSV) into MySQL.
 *
 * 1. In Supabase: Table Editor → table → Export as CSV
 * 2. Save files into server/import-data/ using these names:
 *    profiles.csv, user_roles.csv, products.csv, clients.csv,
 *    orders.csv, order_items.csv, expenses.csv, stock_interest.csv
 * 3. Optional users.csv: id,email,full_name,role (password set via IMPORT_DEFAULT_PASSWORD)
 *
 * Run from server/:  npm run import:csv
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/db.js";
import { hashPassword } from "../src/auth.js";
import { newId } from "../src/utils.js";
import { readCsvFile } from "./csv.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.IMPORT_DATA_DIR || path.join(__dirname, "../import-data");

const BOOL_TRUE = new Set(["true", "t", "1", "yes"]);

function boolVal(v) {
  if (v === "" || v == null) return 0;
  return BOOL_TRUE.has(String(v).toLowerCase()) ? 1 : 0;
}

function dt(v) {
  if (!v || v === "null") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function dateOnly(v) {
  if (!v || v === "null") return null;
  return v.slice(0, 10);
}

function num(v, fallback = 0) {
  if (v === "" || v == null || v === "null") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function filePath(name) {
  return path.join(DATA_DIR, name);
}

function exists(name) {
  return fs.existsSync(filePath(name));
}

async function importUsers() {
  if (!exists("users.csv")) {
    console.log("  users.csv — skipped (optional)");
    return;
  }
  const password = process.env.IMPORT_DEFAULT_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set IMPORT_DEFAULT_PASSWORD (min 8 chars) in .env to import users.csv");
  }
  const rows = readCsvFile(filePath("users.csv"));
  const hash = await hashPassword(password);
  let n = 0;
  for (const r of rows) {
    if (!r.id || !r.email) continue;
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, email_confirmed_at, created_at)
       VALUES (?, ?, ?, NOW(), COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE email = VALUES(email)`,
      [r.id, r.email.toLowerCase(), hash, dt(r.created_at)]
    );
    if (r.full_name || r.email) {
      await pool.execute(
        `INSERT INTO profiles (id, full_name, email, created_at)
         VALUES (?, ?, ?, COALESCE(?, NOW()))
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email)`,
        [r.id, r.full_name || "", r.email.toLowerCase(), dt(r.created_at)]
      );
    }
    if (r.role) {
      await pool.execute(
        `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE role = VALUES(role)`,
        [newId(), r.id, r.role]
      );
    }
    n++;
  }
  console.log(`  users.csv — ${n} row(s)`);
}

async function ensureStubUser(id, email, createdAt) {
  const [existing] = await pool.execute("SELECT id FROM users WHERE id = ?", [id]);
  if (existing.length) return;
  const password = process.env.IMPORT_DEFAULT_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      `Profile ${id} has no matching user — set IMPORT_DEFAULT_PASSWORD to auto-create login stubs`
    );
  }
  const hash = await hashPassword(password);
  await pool.execute(
    `INSERT INTO users (id, email, password_hash, email_confirmed_at, created_at)
     VALUES (?, ?, ?, NOW(), COALESCE(?, NOW()))`,
    [id, (email || `${id.slice(0, 8)}@import.local`).toLowerCase(), hash, dt(createdAt)]
  );
}

async function importProfiles() {
  if (!exists("profiles.csv")) {
    console.log("  profiles.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("profiles.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id) continue;
    await ensureStubUser(r.id, r.email, r.created_at);
    await pool.execute(
      `INSERT INTO profiles (id, full_name, email, created_at)
       VALUES (?, ?, ?, COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email)`,
      [r.id, r.full_name || "", r.email || null, dt(r.created_at)]
    );
    n++;
  }
  console.log(`  profiles.csv — ${n} row(s)`);
}

async function importUserRoles() {
  if (!exists("user_roles.csv")) {
    console.log("  user_roles.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("user_roles.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.user_id || !r.role) continue;
    await pool.execute(
      `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [r.id || newId(), r.user_id, r.role]
    );
    n++;
  }
  console.log(`  user_roles.csv — ${n} row(s)`);
}

async function importProducts() {
  if (!exists("products.csv")) {
    console.log("  products.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("products.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id || !r.name) continue;
    await pool.execute(
      `INSERT INTO products (id, name, slug, description, category, price, cost, stock, unit, image_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), slug = VALUES(slug), description = VALUES(description),
         category = VALUES(category), price = VALUES(price), cost = VALUES(cost),
         stock = VALUES(stock), unit = VALUES(unit), image_url = VALUES(image_url),
         is_active = VALUES(is_active), updated_at = VALUES(updated_at)`,
      [
        r.id,
        r.name,
        r.slug,
        r.description || null,
        r.category || null,
        num(r.price),
        num(r.cost),
        num(r.stock, 0),
        r.unit || "unit",
        r.image_url || null,
        boolVal(r.is_active ?? "true"),
        dt(r.created_at),
        dt(r.updated_at),
      ]
    );
    n++;
  }
  console.log(`  products.csv — ${n} row(s)`);
}

async function importClients() {
  if (!exists("clients.csv")) {
    console.log("  clients.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("clients.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id || !r.full_name) continue;
    await pool.execute(
      `INSERT INTO clients (id, full_name, email, phone, address, notes, notify_on_restock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name), email = VALUES(email), phone = VALUES(phone),
         address = VALUES(address), notes = VALUES(notes), notify_on_restock = VALUES(notify_on_restock)`,
      [
        r.id,
        r.full_name,
        r.email || null,
        r.phone || null,
        r.address || null,
        r.notes || null,
        boolVal(r.notify_on_restock ?? "true"),
        dt(r.created_at),
        dt(r.updated_at),
      ]
    );
    n++;
  }
  console.log(`  clients.csv — ${n} row(s)`);
}

async function importOrders() {
  if (!exists("orders.csv")) {
    console.log("  orders.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("orders.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id) continue;
    await pool.execute(
      `INSERT INTO orders (id, order_number, client_id, customer_name, customer_email, customer_phone,
         status, payment_method, subtotal, total, mpesa_receipt, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE
         customer_name = VALUES(customer_name), status = VALUES(status), total = VALUES(total)`,
      [
        r.id,
        r.order_number,
        r.client_id || null,
        r.customer_name || null,
        r.customer_email || null,
        r.customer_phone || null,
        r.status || "pending",
        r.payment_method || "mpesa",
        num(r.subtotal),
        num(r.total),
        r.mpesa_receipt || null,
        r.notes || null,
        dt(r.created_at),
        dt(r.updated_at),
      ]
    );
    n++;
  }
  console.log(`  orders.csv — ${n} row(s)`);
}

async function importOrderItems() {
  if (!exists("order_items.csv")) {
    console.log("  order_items.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("order_items.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id || !r.order_id) continue;
    await pool.execute(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), quantity = VALUES(quantity)`,
      [
        r.id,
        r.order_id,
        r.product_id || null,
        r.product_name,
        num(r.unit_price),
        num(r.quantity, 1),
        num(r.line_total),
        dt(r.created_at),
      ]
    );
    n++;
  }
  console.log(`  order_items.csv — ${n} row(s)`);
}

async function importExpenses() {
  if (!exists("expenses.csv")) {
    console.log("  expenses.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("expenses.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id || !r.category) continue;
    await pool.execute(
      `INSERT INTO expenses (id, category, description, amount, occurred_on, created_at)
       VALUES (?, ?, ?, ?, COALESCE(?, CURDATE()), COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), category = VALUES(category)`,
      [r.id, r.category, r.description || null, num(r.amount), dateOnly(r.occurred_on), dt(r.created_at)]
    );
    n++;
  }
  console.log(`  expenses.csv — ${n} row(s)`);
}

async function importStockInterest() {
  if (!exists("stock_interest.csv")) {
    console.log("  stock_interest.csv — skipped");
    return;
  }
  const rows = readCsvFile(filePath("stock_interest.csv"));
  let n = 0;
  for (const r of rows) {
    if (!r.id || !r.product_id || !r.email) continue;
    await pool.execute(
      `INSERT INTO stock_interest (id, product_id, client_id, email, notified, created_at)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, NOW()))
       ON DUPLICATE KEY UPDATE email = VALUES(email)`,
      [r.id, r.product_id, r.client_id || null, r.email, boolVal(r.notified ?? "false"), dt(r.created_at)]
    );
    n++;
  }
  console.log(`  stock_interest.csv — ${n} row(s)`);
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.error(`Created ${DATA_DIR} — add CSV exports from Supabase, then run again.`);
    process.exit(1);
  }

  console.log(`Importing from ${DATA_DIR}\n`);
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");

  await importUsers();
  await importProfiles();
  await importUserRoles();
  await importProducts();
  await importClients();
  await importOrders();
  await importOrderItems();
  await importExpenses();
  await importStockInterest();

  await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\nDone.");
  if (exists("users.csv") && process.env.IMPORT_DEFAULT_PASSWORD) {
    console.log(`\nImported users share temporary password from IMPORT_DEFAULT_PASSWORD — ask them to change it after first login.`);
  } else if (!exists("users.csv")) {
    console.log("\nNo users.csv — create accounts via the app or add users.csv + IMPORT_DEFAULT_PASSWORD.");
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
