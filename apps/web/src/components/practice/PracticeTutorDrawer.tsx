"use client";

import { useEffect, useRef, useState } from "react";
import type { PracticeAnswer, PracticeQuestion } from "@/lib/practice-types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PracticeTutorDrawerProps {
  question: PracticeQuestion;
  selectedAnswer?: PracticeAnswer;
  answeredCorrectly?: boolean;
  onClose: () => void;
}

function answerLabel(answer: PracticeAnswer | undefined) {
  if (Array.isArray(answer)) {
    return answer.map((value) => value.toUpperCase()).join(", ");
  }

  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  }

  return typeof answer === "string" && answer ? answer.toUpperCase() : "unknown";
}

export default function PracticeTutorDrawer({
  question,
  selectedAnswer,
  answeredCorrectly,
  onClose,
}: PracticeTutorDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) {
      return;
    }

    const history = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([...history, { role: "assistant" as const, content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const selectedAnswerValue =
        Array.isArray(selectedAnswer)
          ? selectedAnswer.join(",")
          : typeof selectedAnswer === "string"
            ? selectedAnswer
            : selectedAnswer && typeof selectedAnswer === "object"
              ? Object.entries(selectedAnswer)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" | ")
              : undefined;

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          questionId: question.id,
          history: history.filter((message) => message.role === "assistant" || message.role === "user"),
          userMessage: trimmed,
          context: "rationale",
          selectedAnswer: selectedAnswerValue,
          answeredCorrectly,
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  const starterPrompts =
    question.kind === "matrix"
      ? [
          "Walk me through how to classify each row.",
          "Which row is the highest-yield clue?",
          "How do I eliminate the wrong column faster?",
          "Give me a quick matrix strategy drill.",
        ]
      : question.kind === "chart"
        ? [
            "What is the trend telling me?",
            "Which value should change my priority first?",
            "Explain the chart like a bedside precepting note.",
            "What clue am I likely to miss on re-read?",
          ]
        : question.kind === "case-study"
          ? [
              "What are the most urgent findings in this case?",
              "How should I reason through the labs and vitals?",
              "What is the trap in this case?",
              "Give me the next-step priority sequence.",
            ]
          : [
              `Why is ${answerLabel(selectedAnswer)} not the best answer?`,
              "What clue in the stem should I have weighted more heavily?",
              "What distractor was most tempting and why?",
              "Give me a 2-minute pattern drill for this item.",
            ];

  const primer =
    answeredCorrectly
      ? question.takeaway
        ? `You got it right. Lock in the pattern: ${question.takeaway}`
        : "You got it right. Use the tutor to sharpen the pattern so the next rep feels faster."
      : question.takeaway
        ? `Start with the high-yield takeaway: ${question.takeaway}`
        : `Let's find the clue that should have pointed you toward ${answerLabel(selectedAnswer)}.`;

  const summaryLines = [
    `Mode: ${question.mode}`,
    `Category: ${question.category}`,
    `Difficulty: ${question.difficulty}/5`,
    `Correct answer: ${answerLabel(question.correctAnswer)}`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="grid max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-[rgba(74,85,89,0.12)] bg-[#FCFAF4] shadow-[0_32px_90px_rgba(31,38,43,0.18)] lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="border-b border-[rgba(74,85,89,0.08)] bg-[linear-gradient(180deg,rgba(229,233,227,0.42),rgba(252,250,244,0.94))] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">AI Tutor</p>
              <h2 className="mt-3 font-serif text-[2.2rem] leading-[0.95] text-dark">Clinical coaching, not just explanations.</h2>
            </div>
            <button onClick={onClose} className="rounded-full border border-[rgba(74,85,89,0.14)] p-2 text-muted transition hover:text-dark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-6 space-y-3 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Question context</p>
            <p className="font-serif text-[1.2rem] leading-relaxed text-dark">{question.title ?? question.caseTitle ?? question.chartTitle ?? question.scenarioTitle ?? "Practice question"}</p>
            <div className="space-y-2 text-sm leading-6 text-muted">
              {summaryLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Try asking</p>
            <div className="rounded-[22px] border border-[rgba(80,108,120,0.12)] bg-[rgba(255,252,247,0.94)] px-4 py-3 text-sm leading-6 text-dark">
              <strong className="text-[#5A7F88]">Clinical primer:</strong> {primer}
            </div>
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="block w-full rounded-[18px] border border-[rgba(74,85,89,0.12)] bg-white/75 px-4 py-3 text-left text-sm text-dark transition hover:border-[rgba(90,127,136,0.45)] hover:bg-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="border-b border-[rgba(74,85,89,0.08)] px-5 py-4 lg:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Live coaching</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-5">
                  <p className="text-sm leading-7 text-dark">
                    Ask about the pattern, the trap, the safest next action, or the clinical cue that should have changed your answer.
                  </p>
                </div>
              ) : null}

              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-[#4A5559] text-white"
                        : "border border-[rgba(74,85,89,0.1)] bg-white text-dark"
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
          </div>

          <div className="border-t border-[rgba(74,85,89,0.08)] p-5 lg:p-6">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask the tutor..."
                className="min-h-[3.25rem] flex-1 resize-none rounded-[18px] border border-[rgba(74,85,89,0.14)] bg-white px-4 py-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-[rgba(90,127,136,0.5)] focus:ring-2 focus:ring-[rgba(90,127,136,0.12)]"
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="inline-flex h-[3.25rem] shrink-0 items-center justify-center rounded-full bg-[#4A5559] px-5 text-sm font-semibold text-white transition hover:bg-[#3B4549] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ask
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              Powered by the tutor API with fallback coaching for the current question context.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
