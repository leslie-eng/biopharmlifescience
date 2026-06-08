import { Router } from "express";
import { generateAnswer } from "../rag/generate.js";
import { retrieveChunks } from "../rag/retriever.js";

const router = Router();

const rateMap = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

function checkRate(ip) {
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    entry = { start: now, count: 0 };
    rateMap.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count > RATE_MAX) return false;
  return true;
}

router.post("/", async (req, res, next) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRate(ip)) {
      res.status(429).json({ error: "Too many messages. Please wait a moment and try again." });
      return;
    }

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 2000) {
      res.status(400).json({ error: "Message is required (max 2000 characters)." });
      return;
    }

    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-10)
      : [];

    const retrieved = retrieveChunks(message, 4);
    const { answer, mode } = await generateAnswer({ query: message, retrieved, history });

    res.json({
      reply: answer,
      sources: retrieved.map((r) => ({ id: r.chunk.id, title: r.chunk.title })),
      mode,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
