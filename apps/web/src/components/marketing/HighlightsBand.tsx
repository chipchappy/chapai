interface Stat {
  value: string;
  label: string;
  hint?: string;
}

interface Subject {
  name: string;
  hint?: string;
}

interface HighlightsBandProps {
  questionCount: number;
  ngnRatio: number;
  caseStudies?: number;
  readinessExams?: number;
  drugCards?: number;
}

const SUBJECTS: Subject[] = [
  { name: "Cardiac", hint: "ACS · HF · dysrhythmias" },
  { name: "Respiratory", hint: "COPD · ARDS · PE" },
  { name: "Endocrine", hint: "DKA · thyroid · adrenal" },
  { name: "Neuro", hint: "Stroke · ICP · seizure" },
  { name: "Maternity & OB", hint: "Prenatal · intrapartum · postpartum" },
  { name: "Pediatrics", hint: "Growth · immunizations · emergencies" },
  { name: "Mental health", hint: "Crisis · psychotropics · communication" },
  { name: "Pharmacology", hint: "200+ drug cards with priority labs" },
  { name: "Lab values", hint: "ABG · electrolytes · drug levels" },
  { name: "Prioritization", hint: "ABC · Maslow · delegation" },
  { name: "Safety", hint: "Infection control · restraints · falls" },
  { name: "Management of care", hint: "Largest test category" },
];

export default function HighlightsBand({
  questionCount,
  ngnRatio,
  caseStudies = 50,
  readinessExams = 5,
  drugCards = 200,
}: HighlightsBandProps) {
  const stats: Stat[] = [
    { value: questionCount.toLocaleString(), label: "Refined NCLEX items", hint: "Unique distractor reasoning on every one" },
    { value: `${ngnRatio || 25}%`, label: "Real NGN mix", hint: "Case studies, bow-tie, matrix, SATA" },
    { value: `${caseStudies}+`, label: "Multi-step case studies", hint: "CJMM 6-step unfolding format" },
    { value: `${readinessExams}`, label: "Timed readiness exams", hint: "Simulate the live CAT" },
    { value: `${drugCards}+`, label: "Pharmacology tables", hint: "Class · MOA · priority labs · antidotes" },
  ];

  return (
    <section className="highlights-band">
      <div className="highlights-band__inner">
        <header className="highlights-band__header">
          <span className="highlights-band__eyebrow">What you get</span>
          <h2 className="highlights-band__title">Built to cover the whole exam.</h2>
        </header>

        <div className="highlights-band__stats">
          {stats.map((s) => (
            <article key={s.label} className="highlights-band__stat">
              <div className="highlights-band__stat-value">{s.value}</div>
              <div className="highlights-band__stat-label">{s.label}</div>
              {s.hint ? <div className="highlights-band__stat-hint">{s.hint}</div> : null}
            </article>
          ))}
        </div>

        <div className="highlights-band__subjects">
          <span className="highlights-band__subjects-eyebrow">Subjects covered</span>
          <ul className="highlights-band__subjects-grid">
            {SUBJECTS.map((s) => (
              <li key={s.name} className="highlights-band__subject">
                <span className="highlights-band__subject-name">{s.name}</span>
                {s.hint ? <span className="highlights-band__subject-hint">{s.hint}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
