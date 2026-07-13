"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
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

function tutorStorageAnswerKey(answer: PracticeAnswer | undefined) {
  if (Array.isArray(answer)) return answer.join(",");
  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");
  }
  return typeof answer === "string" ? answer : "unknown";
}

function readStoredMessages(storageKey: string): Message[] {
  try {
    const raw = window.localStorage.getItem(storageKey) ?? window.sessionStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is Message => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as Record<string, unknown>;
      return (record.role === "user" || record.role === "assistant") && typeof record.content === "string";
    });
  } catch {
    return [];
  }
}

export default function PracticeTutorDrawer({ question, selectedAnswer, answeredCorrectly, onClose }: PracticeTutorDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [gate, setGate] = useState<null | "auth" | "limit">(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const studyResources = question.studyResources ?? getStudyResourcesForQuestion(question);
  const storageKey = useMemo(
    () => `clarity-ai-tutor:${question.id}:${tutorStorageAnswerKey(selectedAnswer)}`,
    [question.id, selectedAnswer],
  );

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTo({ top: transcript.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setHydrated(false);
    setMessages(readStoredMessages(storageKey));
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(storageKey);
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      const serialized = JSON.stringify(messages);
      window.localStorage.setItem(storageKey, serialized);
      window.sessionStorage.setItem(storageKey, serialized);
    } catch {
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {
        // Keep the in-memory thread when browser storage is unavailable.
      }
    }
  }, [hydrated, messages, storageKey]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const priorMessages = messages;
    const userMessage = { role: "user" as const, content: trimmed };
    const history = messages.slice(-5);
    setMessages([...messages, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      let res: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch("/api/tutor/ask", {
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
        } catch {
          res = null;
        }
        const transient = !res || res.status === 429 || res.status >= 500;
        if (!transient || attempt === 1) break;
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      if (res && !res.ok) {
        const payload = (await res.json().catch(() => null)) as { code?: string } | null;
        if (res.status === 401) {
          setGate("auth");
          setMessages(priorMessages);
          return;
        }
        if (res.status === 403 && payload?.code === "TUTOR_LIMIT") {
          setGate("limit");
          setMessages(priorMessages);
          return;
        }
      }

      if (!res || !res.ok || !res.body) throw new Error("Tutor unavailable");
      setGate(null);

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
            setMessages((previous) => {
              const updated = [...previous];
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
      setMessages((previous) => {
        const updated = [...previous];
        updated[updated.length - 1] = {
          role: "assistant",
          content: [
            "Tutor connection failed, but use the approved rationale first.",
            question.takeaway ? `Pattern: ${question.takeaway}` : `Pattern: ${question.rationale}`,
            "Next rep: name the highest-risk cue, eliminate the tempting distractor, then choose the safest priority action.",
          ].join(" "),
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

  const starterPrompts = question.kind === "matrix"
    ? ["Walk me through how to classify each row.", "Which row is the highest-yield clue?", "How do I eliminate the wrong column faster?"]
    : question.kind === "chart"
      ? ["What is the trend telling me?", "Which value changes my priority first?", "What clue am I likely to miss?"]
      : question.kind === "bow-tie"
        ? ["Connect the clue, action, and outcome.", "What bow-tie trap could pull me off course?", "Which cue anchors the decision map?"]
        : question.kind === "case-study"
          ? ["What findings are most urgent?", "How should I reason through the labs and vitals?", "What is the trap in this case?"]
          : [
              `Why is ${answerLabel(selectedAnswer)} not the best answer?`,
              "What clue should I have weighted more heavily?",
              "What distractor was most tempting and why?",
            ];

  const primer = answeredCorrectly
    ? question.takeaway
      ? `You got it right. Lock in the pattern: ${question.takeaway}`
      : "You got it right. Sharpen the pattern so the next rep feels faster."
    : question.takeaway
      ? `Start with the high-yield takeaway: ${question.takeaway}`
      : `Let's find the clue that should have pointed you toward ${answerLabel(question.correctAnswer)}.`;

  return (
    <section
      role="region"
      aria-label="Clarity AI tutor conversation"
      data-testid="inline-tutor"
      className="mb-20 mt-4 overflow-hidden rounded-lg border border-[rgba(124,131,214,0.42)] bg-[rgba(255,255,255,0.72)] shadow-[0_12px_30px_rgba(91,96,176,0.12)]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[rgba(124,131,214,0.22)] bg-[rgba(124,131,214,0.10)] px-4 py-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#7c83d6] text-white" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#3a3e6e]">Clarity AI tutor</p>
            <p className="mt-0.5 text-xs leading-5 text-[#6a6e9a]">{primer}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close tutor" title="Close tutor" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#686da8] transition hover:bg-[rgba(124,131,214,0.14)] hover:text-[#3a3e6e]">
          <X className="h-4 w-4" />
        </button>
      </header>

      {messages.length === 0 ? (
        <div className="border-b border-[rgba(124,131,214,0.16)] px-4 py-3">
          <p className="text-[0.68rem] font-semibold uppercase text-[#6a6e9a]">Quick prompts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => setInput(prompt)} className="max-w-full rounded-lg border border-[rgba(124,131,214,0.28)] bg-white/80 px-3 py-2 text-left text-xs font-medium text-[#4c518f] transition hover:border-[#7c83d6] hover:bg-white">
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={transcriptRef} aria-live="polite" className="max-h-[22rem] min-h-28 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm leading-6 text-[#6a6e9a]">Ask about a clue, distractor, priority action, or test-taking pattern. Your question and rationale stay visible above.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div data-testid={`tutor-message-${message.role}`} className={`max-w-[90%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${message.role === "user" ? "bg-[#6f75c9] text-white" : "border border-[rgba(124,131,214,0.22)] bg-white text-[#3a3e6e]"}`}>
                  {message.content || <span className="animate-pulse">Thinking...</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[rgba(124,131,214,0.18)] bg-[rgba(224,226,248,0.24)] p-3">
        {gate ? (
          <div className="rounded-lg border border-[rgba(194,154,86,0.3)] bg-[#fffaf0] p-3 text-center">
            <p className="text-sm font-semibold text-dark">{gate === "auth" ? "Create a free account to use the AI tutor." : "You have used today's free tutor coaching."}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {gate === "auth" ? "Your progress and this question stay here, and you will return after signup." : "Upgrade for unlimited tutor exchanges, or return tomorrow when the free allowance resets."}
            </p>
            <a href={gate === "auth" ? `/auth/signup?next=${typeof window !== "undefined" ? encodeURIComponent(`${window.location.pathname}${window.location.search}`) : "%2Fquiz"}` : "/pricing"} className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#5b60b0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4c518f]">
              {gate === "auth" ? "Create free account" : "See plans"}
            </a>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="Ask the tutor..." className="min-h-11 flex-1 resize-none rounded-lg border border-[rgba(124,131,214,0.34)] bg-white px-3 py-2.5 text-sm text-[#30345f] outline-none transition placeholder:text-[#8a8fb8] focus:border-[#7c83d6] focus:ring-2 focus:ring-[rgba(124,131,214,0.16)]" />
            <button type="button" onClick={() => void sendMessage(input)} disabled={!input.trim() || streaming} aria-label="Ask Clarity AI" title="Ask Clarity AI" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#7c83d6] text-white transition hover:bg-[#686fc5] disabled:cursor-not-allowed disabled:opacity-45">
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
