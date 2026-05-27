import Link from "next/link";
import type { QuizQuestion } from "@/lib/types";

function firstSentence(text: string | undefined) {
  const source = String(text ?? "").trim();
  if (!source) {
    return "Reviewed rationales stay short first, then open into the deeper explanation when the student needs it.";
  }

  const match = source.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? source).trim();
}

function cleanCoachingLine(line: string | undefined, fallback: string) {
  const source = String(line ?? "").trim();
  if (!source) {
    return fallback;
  }

  return source.replace(/^(Pattern|Winning move|Pitfall|Next rep|Study move|Confidence check):\s*/i, "").trim();
}

export default function NclexProofShowcase({
  liveCount,
  question,
  className = "",
}: {
  liveCount: number;
  question: QuizQuestion | null;
  className?: string;
}) {
  const questionOptions = question?.options?.slice(0, 4) ?? [];
  const shortRationale = question?.takeaway ?? firstSentence(question?.rationale);
  const detailedRationale = question?.rationale ?? "Detailed, source-backed rationales appear here after the learner answers.";
  const tutorPattern = cleanCoachingLine(
    question?.coachingFrame?.[0],
    "Name the unstable clue first, then tie the answer to the safest next action.",
  );
  const tutorNextRep = cleanCoachingLine(
    question?.coachingFrame?.[3],
    "Rehearse the clue that changes the next safest move before you answer again.",
  );
  const references = question?.references?.slice(0, 2) ?? [];
  const diagramCue = question?.diagramBlueprint?.focus ?? null;

  return (
    <section className={className.trim()}>
      <div className="mx-auto max-w-[1180px] border-t border-[rgba(74,85,89,0.08)] pt-10">
        <div className="max-w-[38rem]">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6F7580]">
            NCLEX product proof
          </span>
          <h2 className="mt-4 text-[clamp(2.35rem,4.2vw,4rem)] leading-[0.96] tracking-[-0.05em] text-[#1E2328]">
            Show the product, not another promise.
          </h2>
          <p className="mt-5 max-w-[34rem] font-sans text-[1.04rem] leading-8 text-[#59606B]">
            Show the reviewed bank size, one real qbank item, the rationale stack, diagram cues, and the tutor follow-up
            buyers actually get once they open NCLEX practice.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.84fr_1.16fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[20px] border border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)] p-6 md:p-7">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F7580]">
                Cheapest start
              </span>
                <h3 className="mt-4 text-[2rem] leading-none tracking-[-0.04em] text-[#1F252A]">$4.99</h3>
                <p className="mt-3 font-sans text-sm leading-7 text-[#5A6170]">
                NCLEX 24-hour access. Open half of the live bank fast, see the rationale quality, and decide whether to
                move into the full NCLEX Base plan.
              </p>
            </article>

            <article className="rounded-[20px] border border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)] p-6 md:p-7">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F7580]">
                NCLEX qbank
              </span>
              <h3 className="mt-4 text-[2rem] leading-none tracking-[-0.04em] text-[#1F252A]">
                {liveCount.toLocaleString()}
              </h3>
              <p className="mt-3 font-sans text-sm leading-7 text-[#5A6170]">
                Unique reviewed NCLEX items in the learner-facing bank, with citations, deeper rationale, diagram
                support, and tutor-ready coaching when it actually helps.
              </p>
            </article>

            <article className="rounded-[20px] border border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)] p-6 md:col-span-2 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F7580]">
                  Tutor + rationale proof
                </span>
                <span className="rounded-full border border-[rgba(24,34,36,0.1)] bg-[rgba(24,34,36,0.05)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4b575b]">
                  Tutor on Dual Premium
                </span>
              </div>

              <div className="mt-4 rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-[rgba(249,246,240,0.9)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6F7580]">AI tutor example</p>
                <p className="mt-3 text-sm leading-7 text-[#1F252A]">
                  <span className="font-semibold">Pattern:</span> {tutorPattern}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#1F252A]">
                  <span className="font-semibold">Next rep:</span> {tutorNextRep}
                </p>
              </div>

              <div className="mt-4 rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-white/92 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6F7580]">Short rationale</p>
                <p className="mt-3 text-sm leading-7 text-[#1F252A]">{shortRationale}</p>
                <details className="mt-4 rounded-[16px] border border-[rgba(24,34,36,0.08)] bg-[rgba(250,249,245,0.96)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[#2f3b40]">
                    Open detailed rationale with sources
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#4F5861]">{detailedRationale}</p>
                  {diagramCue ? (
                    <p className="mt-3 text-xs leading-6 text-[#6B747D]">
                      Visual cue: {diagramCue}
                    </p>
                  ) : null}
                  {references.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {references.map((reference) => (
                        <div key={`${reference.title}:${reference.citation ?? ""}`} className="rounded-[14px] border border-[rgba(74,85,89,0.08)] bg-white/86 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6F7580]">{reference.title}</p>
                          <p className="mt-1 text-xs leading-6 text-[#4F5861]">{reference.citation ?? "Source citation available in the review flow."}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </details>
              </div>
            </article>
          </div>

          <article className="rounded-[24px] border border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)] p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F7580]">
                  Practice question preview
                </span>
                <h3 className="mt-3 text-[1.9rem] leading-[1.02] tracking-[-0.04em] text-[#1F252A]">
                  {question?.category?.replaceAll("_", " ") ?? "Reviewed NCLEX question"}
                </h3>
              </div>
              <Link
                href="/upgrade#nclex"
                className="inline-flex items-center rounded-full bg-[#232a2d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition duration-200 hover:bg-[#374145]"
              >
                See plans
              </Link>
            </div>

            <p className="mt-5 text-base leading-8 text-[#1F252A]">
              {question?.stem ?? "Practice question previews load from the reviewed live NCLEX bank."}
            </p>

            <div className="mt-5 grid gap-3">
              {questionOptions.length > 0 ? questionOptions.map((option) => {
                const isCorrect = option.id === question?.answer;
                return (
                  <div
                    key={option.id}
                    className={`rounded-[18px] border px-4 py-3 text-sm leading-7 ${
                      isCorrect
                        ? "border-[rgba(24,34,36,0.14)] bg-[rgba(35,42,45,0.06)] text-[#1E2328]"
                        : "border-[rgba(74,85,89,0.08)] bg-white/84 text-[#4F5861]"
                    }`}
                  >
                    <span className="mr-3 font-semibold uppercase text-[#6F7580]">{option.id}</span>
                    {option.text}
                  </div>
                );
              }) : (
                <div className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-white/84 px-4 py-3 text-sm leading-7 text-[#4F5861]">
                  Reviewed practice examples appear here once the live bank is loaded.
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
