import { buildContext } from "./retriever.js";

const SYSTEM_PROMPT = `You are the Biopharmlifescience East Africa website assistant. You help visitors learn about Biopharmlifescience's managed medical supply services, proactive inventory model, product catalog, and how to get in touch.

Rules:
- Answer ONLY using the provided context. If the context does not contain the answer, say you are not sure and suggest booking a free facility assessment or contacting Biopharmlifescience via WhatsApp (+254 714 647 972) or email biopharmlifescience@gmail.com.
- Be concise, professional, and warm. Use short paragraphs or bullet points when helpful.
- Do not invent prices, stock levels, or policies not in the context.
- You are not a medical advisor; do not give clinical treatment advice.`;

function fallbackAnswer(query, context) {
  const intro =
    "Here is what I can share about Biopharmlifescience East Africa based on our website information:";
  const body = context
    .split(/\n\n/)
    .slice(0, 3)
    .map((block) => block.replace(/^\[\d+\]\s*/m, "").trim())
    .join("\n\n");
  const outro =
    "\n\nFor a tailored plan or product pricing, please book a free facility assessment or message us on WhatsApp (+254 714 647 972).";
  if (!body.trim()) {
    return `I'd be happy to help you learn about Biopharmlifescience's managed supply services for clinics. Try asking about our proactive model, product categories, or how to book a facility assessment. You can also reach us at +254 714 647 972 or biopharmlifescience@gmail.com.`;
  }
  return `${intro}\n\n${body}${outro}`;
}

async function generateWithOpenAI(query, context, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n---\nContext:\n${context}` },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: query },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI chat error:", res.status, err);
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

export async function generateAnswer({ query, retrieved, history = [] }) {
  const context = buildContext(retrieved);
  const llmAnswer = await generateWithOpenAI(query, context, history);
  if (llmAnswer) {
    return { answer: llmAnswer, mode: "openai" };
  }
  return { answer: fallbackAnswer(query, context), mode: "retrieval" };
}
