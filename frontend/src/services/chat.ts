import { ApiError, request } from "@/services/http";
import type { ChatMessage, ChatResponse } from "@/types/api";

export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<ChatResponse> {
  try {
    return await request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    });
  } catch (e) {
    // Show the API's own message (e.g. rate limiting); anything else is a connection problem.
    if (e instanceof ApiError && e.code) throw e;
    throw new Error("Could not reach the assistant. Please try again.");
  }
}
