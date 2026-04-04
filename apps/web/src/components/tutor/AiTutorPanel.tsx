"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiTutorPanelProps {
  questionContext: {
    id: string;
    stem: string;
    correctAnswer: string;
    rationale: string;
    selectedAnswer?: string | null;
    answeredCorrectly?: boolean;
    takeaway?: string | null;
    visualRationale?: {
      title: string;
      caption?: string;
      conclusion?: string;
    } | null;
  };
  onClose: () => void;
}

export default function AiTutorPanel({ questionContext, onClose }: AiTutorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) {
      return;
    }

    const nextUserMessage: Message = { role: "user", content: text };
    const history = [...messages, nextUserMessage];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questionContext.id,
          history: messages,
          userMessage: text,
          context: "rationale",
          selectedAnswer: questionContext.selectedAnswer ?? undefined,
          answeredCorrectly: questionContext.answeredCorrectly ?? undefined,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Tutor unavailable");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.delta?.text ?? parsed?.choices?.[0]?.delta?.content ?? "";
            if (!delta) {
              continue;
            }

            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                role: "assistant",
                content: `${last?.content ?? ""}${delta}`,
              };
              return updated;
            });
          } catch {
            continue;
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Tutor unavailable right now. Try again shortly.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  const starterPrompts = questionContext.answeredCorrectly
    ? [
        "What clue made this answer the priority?",
        "How should I recognize this pattern faster next time?",
        "What would make a distractor tempting here?",
        "Give me a 2-minute study drill for this pattern",
      ]
    : [
        `Why is ${questionContext.correctAnswer.toUpperCase()} safer than ${questionContext.selectedAnswer?.toUpperCase() ?? "my choice"}?`,
        "What clue in the stem should have changed my next action?",
        "Explain the clinical reasoning step by step",
        "What trap did I fall into and how do I avoid it next time?",
      ];

  const primer =
    questionContext.answeredCorrectly
      ? questionContext.takeaway
        ? `You got it right. Lock in the pattern: ${questionContext.takeaway}`
        : "You got it right. Use the tutor to sharpen the pattern so the next rep feels faster."
      : questionContext.takeaway
        ? `You missed this one. Start with the high-yield takeaway: ${questionContext.takeaway}`
        : `You missed this one. Let's find the clue that should have pushed you toward ${questionContext.correctAnswer.toUpperCase()}.`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" />
                <path d="M6 6.5C6 5.67 6.67 5 7.5 5S9 5.67 9 6.5c0 1.17-1.75 1.5-1.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="7.5" cy="11.5" r="1" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-dark">AI Tutor</p>
              <p className="text-xs text-muted">Pattern coaching, not just explanations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted transition-colors hover:text-dark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Try asking</p>
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-2 text-xs text-dark">
                <strong className="text-teal-700">Clinical primer:</strong> {primer}
              </div>
              {questionContext.visualRationale?.conclusion ? (
                <div className="rounded-xl border border-[rgba(80,108,120,0.14)] bg-[rgba(255,252,247,0.92)] px-3 py-2 text-xs text-dark">
                  <strong className="text-dark">{questionContext.visualRationale.title}:</strong> {questionContext.visualRationale.conclusion}
                </div>
              ) : null}
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="block w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-dark transition-all hover:border-teal-400 hover:bg-teal-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-teal-600 text-white"
                    : "border border-border bg-bg text-dark"
                }`}
              >
                {message.content || (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask the tutor..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border px-3.5 py-2.5 text-sm text-dark transition-all placeholder:text-muted focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || streaming}
              className="btn-primary shrink-0 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 14L14 8 2 2v5l8 1-8 1v5z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            Powered by Claude - coaching for patterns, traps, and next-step study
          </p>
        </div>
      </div>
    </div>
  );
}
