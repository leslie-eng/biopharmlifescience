import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { FACILITY_ASSESSMENT_BOOK_PATH } from "@/lib/facilityAssessment";
import { sendChatMessage, type ChatMessage } from "@/lib/chat";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm the Biopharmlifescience assistant. Ask me about our managed supply model, product categories, how we work with clinics, or how to get in touch.",
};

const SUGGESTIONS = [
  "What is Dhibiti model?",
  "What products do you supply?",
  "How do I book a facility assessment?",
  "How can I contact Biopharmlifescience?",
];

export const SiteChatbot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLLIElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const historyForApi = messages.filter(
        (m) => (m.role === "user" || m.role === "assistant") && m.content !== WELCOME.content,
      );
      const { reply } = await sendChatMessage(trimmed, historyForApi);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit(input);
  };

  return (
    <>
      {!open && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-elegant hover:shadow-glow p-0 safe-bottom"
          aria-label="Open Biopharmlifescience assistant chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Biopharmlifescience assistant"
          className={cn(
            "fixed z-50 flex flex-col bg-background border border-border shadow-elegant",
            "inset-x-3 bottom-3 top-auto h-[min(520px,calc(100dvh-5rem))] rounded-2xl",
            "sm:inset-auto sm:bottom-5 sm:right-5 sm:left-auto sm:w-[min(100vw-2rem,400px)] safe-bottom",
          )}
        >
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 shrink-0 rounded-t-2xl bg-gradient-hero">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">Biopharmlifescience Assistant</p>
              <p className="text-xs text-muted-foreground truncate">Learn about our services</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="flex-1 px-4 py-3">
            <ul className="space-y-3 pr-2">
              {messages.map((msg, i) => (
                <li
                  key={i}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                      : "mr-auto bg-muted text-foreground rounded-bl-md border border-border/50",
                  )}
                >
                  {msg.content}
                </li>
              ))}
              {loading && (
                <li className="mr-auto flex items-center gap-2 text-sm text-muted-foreground px-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </li>
              )}
              <li ref={bottomRef} />
            </ul>
          </ScrollArea>

          {error && (
            <p className="px-4 pb-1 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void submit(s)}
                  className="text-xs rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-border p-3 shrink-0 space-y-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(input);
                  }
                }}
                placeholder="Ask about Biopharmlifescience…"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] max-h-28"
                disabled={loading}
                aria-label="Your message"
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl"
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-snug">
              Answers use Biopharmlifescience website information.{" "}
              <Link to={FACILITY_ASSESSMENT_BOOK_PATH} className="text-primary hover:underline">
                Book an assessment
              </Link>{" "}
              or WhatsApp us for personal help. Not medical advice.
            </p>
          </form>
        </div>
      )}
    </>
  );
};
