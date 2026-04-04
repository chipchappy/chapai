import DailyQuestionSignup from "./DailyQuestionSignup";
import SplitImageHero from "./SplitImageHero";
import { getArtworkForExam } from "./marketingArtwork";

interface ExamLandingProps {
  exam: "ccrn" | "nclex";
  title: string;
  body: string;
  eyebrow: string;
  proofTitle: string;
  proofBody: string;
  sampleCategory: string;
  sampleStem: string;
  sampleInsight: string;
  stats: Array<{ label: string; value: string }>;
  fitTitle: string;
  fitBody: string;
  unlockTitle: string;
  unlockBody: string;
  urgencyTitle: string;
  urgencyBody: string;
}

export default function ExamLanding({
  exam,
  title,
  body,
  eyebrow,
  proofTitle,
  proofBody,
  sampleCategory,
  sampleStem,
  sampleInsight,
  stats,
  fitTitle,
  fitBody,
  unlockTitle,
  unlockBody,
  urgencyTitle,
  urgencyBody,
}: ExamLandingProps) {
  const artwork = getArtworkForExam(exam);

  return (
    <main className="page-shell">
      <SplitImageHero
        backgroundColor={exam === "ccrn" ? "#E5E9E3" : "#F5F1E8"}
        eyebrow={eyebrow}
        title={title}
        body={body}
        buttonHref={`/upgrade#${exam}`}
        buttonLabel={`Choose ${exam.toUpperCase()} plan`}
        secondaryHref="/quiz"
        secondaryLabel="Preview questions"
        supportLine="AI review, original questions, and a cleaner study flow."
        artwork={artwork}
      />

      <section className="mt-8 grid gap-4 rounded-[28px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-card md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label}>
            <span className="section-label">{item.label}</span>
            <p className="mt-3 font-sans text-2xl font-semibold text-[#1E2328]">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="exam-editorial-band">
        <div className="exam-editorial-copy">
          <span className="section-label">Clinical reasoning system</span>
          <h2>{proofTitle}</h2>
          <p>{proofBody}</p>
        </div>

        <div className="exam-sample-panel">
          <div className="exam-sample-top">
            <span>{sampleCategory}</span>
            <span>AI review</span>
          </div>
          <h3>{sampleStem}</h3>
          <p>{sampleInsight}</p>
          <div className="exam-sample-proof">
            <div>
              <strong>Original scenarios</strong>
              <span>Written to feel clinical, not synthetic.</span>
            </div>
            <div>
              <strong>One cleaner next step</strong>
              <span>Answer, pattern, action.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="exam-decision-band">
        <div className="exam-decision-copy">
          <span className="section-label">Why buy this package now</span>
          <h2>Choose the exam-specific path, then study inside one cleaner product.</h2>
          <p>The goal is fewer wasted clicks, clearer explanations, and a faster route into the material that actually moves your score.</p>
        </div>

        <div className="exam-decision-grid">
          <article className="exam-decision-card">
            <span>Best fit</span>
            <strong>{fitTitle}</strong>
            <p>{fitBody}</p>
          </article>
          <article className="exam-decision-card">
            <span>What you unlock</span>
            <strong>{unlockTitle}</strong>
            <p>{unlockBody}</p>
          </article>
        </div>

        <div className="exam-decision-note">
          <span>Why founding access matters</span>
          <p>{urgencyBody}</p>
        </div>

        <div className="package-bridge-actions">
          <a href={`/upgrade#${exam}`} className="btn-primary">
            {`Choose ${exam.toUpperCase()} package`}
          </a>
          <a href="/upgrade" className="btn-secondary">
            Compare both packages
          </a>
        </div>
      </section>

      <DailyQuestionSignup
        exam={exam}
        source={`${exam}-daily-question`}
        title={`Get one ${exam.toUpperCase()} question each day.`}
        body={`A lighter daily touchpoint for ${exam.toUpperCase()} buyers who want momentum before they commit to the full package.`}
      />
    </main>
  );
}
