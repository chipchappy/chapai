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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(35,39,42,0.4)] p-4 backdrop-blur-md sm:items-center">
      <div className="flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-[30px] border border-[rgba(74,85,89,0.1)] bg-[linear-gradient(180deg,rgba(252,249,243,0.98),rgba(247,242,234,0.98))] shadow-[0_28px_80px_rgba(31,38,43,0.18)]">
        <div className="flex items-center justify-between border-b border-[rgba(74,85,89,0.08)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A5559]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" />
                <path d="M6 6.5C6 5.67 6.67 5 7.5 5S9 5.67 9 6.5c0 1.17-1.75 1.5-1.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="7.5" cy="11.5" r="1" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">AI Tutor</p>
              <p className="text-xs text-muted">Pattern coaching, not just explanations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted transition-colors hover:text-dark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Try asking</p>
              <div className="rounded-[18px] border border-[rgba(90,127,136,0.14)] bg-[rgba(255,252,247,0.92)] px-4 py-3 text-sm leading-6 text-dark">
                <strong className="text-[#5A7F88]">Clinical primer:</strong> {primer}
              </div>
              {questionContext.visualRationale?.conclusion ? (
                <div className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm leading-6 text-dark">
                  <strong className="text-dark">{questionContext.visualRationale.title}:</strong> {questionContext.visualRationale.conclusion}
                </div>
              ) : null}
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="block w-full rounded-[18px] border border-[rgba(74,85,89,0.12)] bg-[rgba(255,255,255,0.8)] px-4 py-3 text-left text-sm leading-6 text-dark transition hover:border-[rgba(90,127,136,0.35)] hover:bg-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-7 ${
                  message.role === "user"
                    ? "bg-[#4A5559] text-white"
                    : "border border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.88)] text-dark"
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

        <div className="border-t border-[rgba(74,85,89,0.08)] p-5">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask the tutor..."
              rows={1}
              className="flex-1 resize-none rounded-[18px] border border-[rgba(74,85,89,0.14)] bg-white px-4 py-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-[rgba(90,127,136,0.45)] focus:ring-2 focus:ring-[rgba(90,127,136,0.12)]"
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || streaming}
              className="inline-flex h-[3.25rem] shrink-0 items-center justify-center rounded-full bg-[#4A5559] px-5 text-sm font-semibold text-white transition hover:bg-[#3B4549] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ask
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Coaching for patterns, traps, and the next safest step.
          </p>
        </div>
      </div>
    </div>
  );
}
