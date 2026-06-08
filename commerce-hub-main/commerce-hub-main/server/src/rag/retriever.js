import { CHAT_KNOWLEDGE_CHUNKS } from "../data/chat-knowledge.js";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "can", "about", "what", "how", "when", "where",
  "who", "which", "this", "that", "these", "those", "i", "you", "your", "our", "we", "they",
  "it", "its", "with", "from", "as", "by", "not", "no", "yes", "me", "my", "tell", "please",
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function termFrequency(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

function buildIdf(docs) {
  const df = new Map();
  const n = docs.length;
  for (const doc of docs) {
    const seen = new Set(tokenize(doc.text + " " + doc.title));
    for (const term of seen) df.set(term, (df.get(term) || 0) + 1);
  }
  const idf = new Map();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

function vectorize(tf, idf) {
  const vec = new Map();
  let norm = 0;
  for (const [term, freq] of tf) {
    const w = freq * (idf.get(term) || 1);
    vec.set(term, w);
    norm += w * w;
  }
  return { vec, norm: Math.sqrt(norm) || 1 };
}

function cosine(a, b) {
  let dot = 0;
  const [smaller, larger] = a.vec.size < b.vec.size ? [a, b] : [b, a];
  for (const [term, w] of smaller.vec) {
    const w2 = larger.vec.get(term);
    if (w2) dot += w * w2;
  }
  return dot / (a.norm * b.norm);
}

const idf = buildIdf(CHAT_KNOWLEDGE_CHUNKS);
const chunkVectors = CHAT_KNOWLEDGE_CHUNKS.map((chunk) => {
  const tokens = tokenize(`${chunk.title} ${chunk.text}`);
  return { chunk, ...vectorize(termFrequency(tokens), idf) };
});

/**
 * Retrieve top-k knowledge chunks for a user query (lexical TF-IDF RAG).
 */
export function retrieveChunks(query, topK = 4) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) {
    return CHAT_KNOWLEDGE_CHUNKS.slice(0, topK).map((chunk, i) => ({
      chunk,
      score: 1 - i * 0.1,
    }));
  }

  const qVec = vectorize(termFrequency(qTokens), idf);
  const scored = chunkVectors
    .map(({ chunk, vec, norm }) => ({
      chunk,
      score: cosine({ vec, norm }, qVec),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return CHAT_KNOWLEDGE_CHUNKS.slice(0, topK).map((chunk, i) => ({
      chunk,
      score: 0.5 - i * 0.05,
    }));
  }

  return scored.slice(0, topK);
}

export function buildContext(retrieved) {
  return retrieved
    .map((r, i) => `[${i + 1}] ${r.chunk.title}\n${r.chunk.text}`)
    .join("\n\n");
}
