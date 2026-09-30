import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { errorHandler } from "./middleware.js";
import authRoutes from "./routes/auth.js";
import clientsRoutes from "./routes/clients.js";
import dashboardRoutes from "./routes/dashboard.js";
import expensesRoutes from "./routes/expenses.js";
import ordersRoutes from "./routes/orders.js";
import productsRoutes from "./routes/products.js";
import stockInterestRoutes from "./routes/stockInterest.js";
import uploadsRoutes from "./routes/uploads.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "../uploads"));
fs.mkdirSync(uploadRoot, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 3001);

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:8080")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadRoot));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "biolinks-commerce-api", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", service: "biolinks-commerce-api", database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/stock-interest", stockInterestRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);

const staticDir = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;
if (staticDir && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
  console.log(`Serving frontend from ${staticDir}`);
}

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Biopharmlifescience API listening on http://localhost:${port}`);
});
