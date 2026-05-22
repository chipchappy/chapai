"use client";

import { useEffect, useRef, useState } from "react";
import { getStudyResourcesForQuestion } from "@/lib/study-resources";
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
  if (Array.isArray(answer)) return answer.map((value) => value.toUpperCase()).join(", ");
  if (answer && typeof answer === "object") return Object.entries(answer).map(([key, value]) => `${key}: ${value}`).join(" | ");
  return typeof answer === "string" && answer ? answer.toUpperCase() : "unknown";
}

function pillClass(tone: "sage" | "blue" | "gold" | "neutral" = "neutral") {
  return tone === "sage"
    ? "border-[rgba(126,157,134,0.22)] bg-[rgba(126,157,134,0.10)] text-[#55715e]"
    : tone === "blue"
      ? "border-[rgba(90,127,136,0.20)] bg-[rgba(90,127,136,0.10)] text-[#4f6f77]"
      : tone === "gold"
        ? "border-[rgba(194,154,86,0.24)] bg-[rgba(194,154,86,0.12)] text-[#8d6a2e]"
        : "border-[rgba(74,85,89,0.12)] bg-white/72 text-muted";
}

export default function PracticeTutorDrawer({ question, selectedAnswer, answeredCorrectly, onClose }: PracticeTutorDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const studyResources = question.studyResources ?? getStudyResourcesForQuestion(question);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const history = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([...history, { role: "assistant" as const, content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: { ...question, studyResources },
          questionId: question.id,
          history,
          userMessage: trimmed,
          context: "rationale",
          selectedAnswer,
          answeredCorrectly,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Tutor unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.delta?.text ?? parsed?.choices?.[0]?.delta?.content ?? "";
            if (!delta) continue;

            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { role: "assistant", content: `${last?.content ?? ""}${delta}` };
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
        updated[updated.length - 1] = { role: "assistant", content: "Tutor unavailable right now. Try again shortly." };
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
      ? ["Walk me through how to classify each row.", "Which row is the highest-yield clue?", "How do I eliminate the wrong column faster?", "Give me a quick matrix strategy drill."]
      : question.kind === "chart"
        ? ["What is the trend telling me?", "Which value should change my priority first?", "Explain the chart like a bedside precepting note.", "What clue am I likely to miss on re-read?"]
        : question.kind === "bow-tie"
          ? [
              "Help me connect the clue, the stabilizing move, and the outcome faster.",
              "What bow-tie trap was most likely to pull me off course?",
              "Which cue should have anchored the decision map first?",
              "Give me a quick bow-tie pattern drill for this type of item.",
            ]
        : question.kind === "case-study"
          ? ["What are the most urgent findings in this case?", "How should I reason through the labs and vitals?", "What is the trap in this case?", "Give me the next-step priority sequence."]
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

  const answerStateLabel = answeredCorrectly == null ? "Question still open" : answeredCorrectly ? "Answered correctly" : "Reviewing a miss";
  const contextTitle = question.title ?? question.caseTitle ?? question.chartTitle ?? question.scenarioTitle ?? "Practice question";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(6,12,10,0.8)] p-3 backdrop-blur-xl sm:p-4">
      <div className="quiz-tutor-shell grid h-[calc(100dvh-1.5rem)] w-full max-w-[min(1500px,100%)] overflow-hidden rounded-[34px] border border-[rgba(216,228,217,0.12)] bg-[radial-gradient(circle_at_top_left,rgba(126,157,134,0.14),rgba(126,157,134,0)_24%),radial-gradient(circle_at_bottom_right,rgba(95,143,150,0.14),rgba(95,143,150,0)_24%),linear-gradient(180deg,rgba(14,24,20,0.98),rgba(8,15,12,0.98))] shadow-[0_40px_120px_rgba(0,0,0,0.52)] lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="min-h-0 overflow-y-auto border-b border-[rgba(216,228,217,0.08)] bg-[linear-gradient(180deg,rgba(18,31,25,0.98),rgba(10,18,15,0.98))] p-5 lg:border-b-0 lg:border-r lg:border-r-[rgba(216,228,217,0.08)] lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(223,232,224,0.54)]">AI Tutor</p>
              <h2 className="mt-3 font-serif text-[2.2rem] leading-[0.95] text-[#eff0e8]">clinical coaching, not just explanations.</h2>
            </div>
            <button onClick={onClose} className="rounded-full border border-[rgba(216,228,217,0.12)] p-2 text-[rgba(223,232,224,0.58)] transition hover:text-[#eff0e8]" aria-label="Close tutor">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-6 space-y-3 rounded-[24px] border border-[rgba(216,228,217,0.1)] bg-[linear-gradient(180deg,rgba(22,37,30,0.92),rgba(13,25,20,0.92))] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(223,232,224,0.54)]">Question context</p>
            <p className="font-serif text-[1.2rem] leading-relaxed text-[#eff0e8]">{contextTitle}</p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(223,232,224,0.56)]">
              <span className={`rounded-full border px-3 py-1 ${pillClass(answeredCorrectly == null ? "neutral" : answeredCorrectly ? "sage" : "gold")}`}>{answerStateLabel}</span>
              {selectedAnswer ? (
                <span className={`rounded-full border px-3 py-1 ${pillClass("blue")}`}>Your answer {answerLabel(selectedAnswer)}</span>
              ) : null}
              {question.kind === "bow-tie" ? <span className={`rounded-full border px-3 py-1 ${pillClass("gold")}`}>Bow-tie logic</span> : null}
            </div>
            <div className="space-y-2 text-sm leading-6 text-[rgba(223,232,224,0.7)]">
              {summaryLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {question.speedCue ? (
              <div className="mt-3 rounded-[18px] border border-[rgba(95,143,150,0.18)] bg-[rgba(95,143,150,0.12)] px-3 py-3 text-sm leading-6 text-[#eff0e8]">
                <strong className="font-semibold">Speed cue:</strong> {question.speedCue}
              </div>
            ) : null}
          </div>

          {question.coachingFrame?.length ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Coaching frame</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-dark">
                {question.coachingFrame.map((item) => (
                  <li key={item} className="ml-5 list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {question.references?.length ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">References</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-dark">
                {question.references.map((reference, index) => (
                  <div key={`${reference.title}-${index}`} className="rounded-[16px] border border-[rgba(108,96,79,0.1)] bg-[rgba(255,251,243,0.95)] px-3 py-2 shadow-[0_8px_18px_rgba(58,46,34,0.03)]">
                    <p className="font-semibold">{reference.title}</p>
                    {reference.citation ? <p className="text-muted">{reference.citation}</p> : null}
                    {reference.href ? (
                      <a href={reference.href} target="_blank" rel="noreferrer" className="text-[#5A7F88] underline underline-offset-2">
                        Open source
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {studyResources.length ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Free study links</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-dark">
                {studyResources.map((resource, index) => (
                  <div key={`${resource.href}-${index}`} className="rounded-[16px] border border-[rgba(108,96,79,0.1)] bg-[rgba(255,251,243,0.95)] px-3 py-2 shadow-[0_8px_18px_rgba(58,46,34,0.03)]">
                    <p className="font-semibold">{resource.title}</p>
                    <p className="text-muted">{resource.source} | {resource.topic}</p>
                    <p className="text-muted">{resource.why}</p>
                    <a href={resource.href} target="_blank" rel="noreferrer noopener" className="text-[#5A7F88] underline underline-offset-2">
                      Open free resource
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {question.diagramBlueprint ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Visual reasoning</p>
              <p className="mt-3 text-sm font-semibold text-dark">{question.diagramBlueprint.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{question.diagramBlueprint.focus}</p>
            </div>
          ) : null}

          {question.deepRationale ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Deep rationale</p>
              <p className="mt-3 text-sm leading-6 text-dark">{question.deepRationale}</p>
            </div>
          ) : null}

          {question.exhibits?.length ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Case exhibits</p>
              <div className="mt-3 space-y-3">
                {question.exhibits.slice(0, 2).map((exhibit, index) => (
                  <div key={`${exhibit.title}-${index}`} className="rounded-[16px] border border-[rgba(108,96,79,0.1)] bg-[rgba(255,251,243,0.95)] px-3 py-2">
                    <p className="font-semibold text-dark">{exhibit.title}</p>
                    {exhibit.body ? <p className="mt-1 text-sm leading-6 text-muted">{exhibit.body}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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

        <section className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(12,20,17,0.98),rgba(8,15,12,0.98))]">
          <div className="border-b border-[rgba(216,228,217,0.08)] px-5 py-4 lg:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(223,232,224,0.54)]">Live coaching</p>
              <span className="rounded-full border border-[rgba(216,228,217,0.12)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(223,232,224,0.54)]">
                Tied to this question's rationale and sources
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="rounded-[24px] border border-[rgba(108,96,79,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,244,236,0.92))] p-5 shadow-[0_12px_26px_rgba(58,46,34,0.04)]">
                  <p className="text-sm leading-7 text-dark">
                    Ask about the pattern, the trap, the safest next action, or the one clue that should have changed your answer.
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">
                    The tutor stays tied to this question&apos;s rationale, coaching frame, and references.
                  </p>
                </div>
              ) : null}

              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-7 shadow-[0_10px_24px_rgba(31,38,43,0.04)] ${
                      message.role === "user"
                        ? "bg-[linear-gradient(180deg,#4A5559,#3f4a4d)] text-white"
                        : "border border-[rgba(108,96,79,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,244,236,0.92))] text-dark"
                    }`}
                  >
                    {message.content || (
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                          .
                        </span>
                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                          .
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)] p-5 lg:p-6">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask the tutor..."
                className="min-h-[3.25rem] flex-1 resize-none rounded-[18px] border border-[rgba(108,96,79,0.12)] bg-[rgba(255,255,255,0.96)] px-4 py-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-[rgba(90,127,136,0.5)] focus:ring-2 focus:ring-[rgba(90,127,136,0.12)]"
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
