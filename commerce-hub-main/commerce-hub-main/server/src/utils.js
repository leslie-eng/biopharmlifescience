import { v4 as uuidv4 } from "uuid";

export function newId() {
  return uuidv4();
}

export function generateOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `BL-${yy}${mm}${dd}-${rand}`;
}

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Normalize MySQL row booleans and decimals for JSON API */
export function serializeRow(row) {
  if (!row) return row;
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (typeof out[key] === "bigint") out[key] = Number(out[key]);
    if (key === "is_active" || key === "notify_on_restock" || key === "notified") {
      out[key] = Boolean(out[key]);
    }
    if (out[key] instanceof Date) out[key] = out[key].toISOString();
  }
  return out;
}

export function serializeRows(rows) {
  return rows.map(serializeRow);
}
