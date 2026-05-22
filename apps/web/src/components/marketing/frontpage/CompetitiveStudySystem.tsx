import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  Flag,
  Highlighter,
  Layers3,
  ListChecks,
  Maximize2,
  Stethoscope,
  StickyNote,
  Strikethrough,
  Target,
  Timer,
} from "lucide-react";

type CompetitiveStudySystemProps = {
  route?: "home" | "nclex" | "ccrn";
  nclexCount: number;
  ccrnCount: number;
  ngnRatio?: number;
};

const subjectRows = [
  { key: "management_of_care", label: "Management of care", count: "delegation, priority, assignment" },
  { key: "safety_infection_control", label: "Safety and infection control", count: "isolation, precautions, risk control" },
  { key: "health_promotion", label: "Health promotion", count: "screening, prevention, teaching" },
  { key: "pharmacological", label: "Pharmacology", count: "high-alert meds, side effects, teaching" },
  { key: "reduction_of_risk", label: "Risk reduction", count: "labs, complications, diagnostic readiness" },
  { key: "physiological_adaptation", label: "Physiological adaptation", count: "acute changes, unstable cues, rescue" },
  { key: "basic_care_comfort", label: "Fundamentals", count: "comfort, mobility, basic care" },
  { key: "psychosocial", label: "Mental health", count: "therapeutic communication, safety" },
];

const ccrnSubjectRows = [
  { key: "cardiovascular", label: "Cardiovascular", count: "shock, rhythm, perfusion, drips" },
  { key: "respiratory", label: "Respiratory", count: "ventilation, oxygenation, ARDS" },
  { key: "neurology", label: "Neurology", count: "neuro checks, ICP, stroke, sedation" },
  { key: "renal", label: "Renal", count: "AKI, fluids, electrolytes, replacement" },
  { key: "endocrine", label: "Endocrine", count: "glucose, DKA, adrenal, thyroid" },
  { key: "multisystem", label: "Multisystem", count: "sepsis, trauma, priority rescue" },
];

const practiceModes = [
  { icon: ClipboardList, label: "Standalone bank", body: "Filter by subject, NGN type, deck length.", href: "/quiz?exam=nclex&mode=standard" },
  { icon: Layers3, label: "NGN case studies", body: "Six-item unfolding cases with shared exhibits.", href: "/quiz?exam=nclex&mode=case-study" },
  { icon: Target, label: "Readiness exam", body: "Five timed sims with full Pearson chrome.", href: "/quiz?mode=practice-exam&practiceExam=nclex-sim-1" },
  { icon: BarChart3, label: "Weak-area review", body: "Adaptive queue from missed-item analytics.", href: "/home" },
];

const chartTabs = [
  { key: "history", label: "History & Physical", icon: FileText },
  { key: "notes", label: "Nurses' Notes", icon: StickyNote },
  { key: "vitals", label: "Vital Signs", icon: Activity },
  { key: "labs", label: "Laboratory", icon: FlaskConical },
  { key: "orders", label: "Orders", icon: ListChecks },
];

function formatCount(value: number) {
  return value > 0 ? value.toLocaleString() : "live";
}

export default function CompetitiveStudySystem({
  route = "home",
  nclexCount,
  ccrnCount,
  ngnRatio = 0,
}: CompetitiveStudySystemProps) {
  const routeLabel = route === "ccrn" ? "critical-care" : route === "nclex" ? "nclex" : "dual-track";
  const heroMetric = route === "ccrn" ? `${formatCount(ccrnCount)} CCRN` : `${formatCount(nclexCount)} NCLEX`;
  const activeSubjectRows = route === "ccrn" ? ccrnSubjectRows : subjectRows;
  const activeExam = route === "ccrn" ? "ccrn" : "nclex";
  const activeLaneLabel = route === "ccrn" ? "CCRN lanes" : "NCLEX lanes";

  return (
    <section className="px-3 py-8 sm:px-4 sm:py-10 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1480px] overflow-hidden rounded-[24px] border border-[rgba(74,85,89,0.1)] bg-[linear-gradient(135deg,rgba(255,252,247,0.94),rgba(239,246,243,0.82)_46%,rgba(246,241,231,0.92))] shadow-[0_26px_70px_rgba(31,38,43,0.08)] sm:rounded-[34px]">
        <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
          {/* LEFT: hero + stats */}
          <div className="border-b border-[rgba(74,85,89,0.08)] p-5 sm:p-6 md:p-7 lg:border-b-0 lg:border-r lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(90,127,136,0.18)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4f6f77]">
                <Stethoscope className="h-3.5 w-3.5" />
                {routeLabel} practice center
              </span>
              <span className="rounded-full border border-[rgba(194,154,86,0.2)] bg-[rgba(194,154,86,0.1)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a2e]">
                NGN {ngnRatio > 0 ? `${ngnRatio}%` : "live mix"}
              </span>
            </div>
            <h2 className="mt-5 max-w-[34rem] font-serif text-[clamp(1.75rem,3.4vw,3.2rem)] font-medium leading-[1.02] tracking-[-0.04em] text-dark">
              The full standardized NCLEX testing experience: categories, NGN, sims, and review in one workspace.
            </h2>
            <p className="mt-4 max-w-[34rem] text-[15px] leading-[1.7] text-muted sm:text-base sm:leading-8">
              Every subject lane, every NGN item type, and the same chart-tabbed test chrome you'll see on test day. Drill by category, run timed readiness exams, work full NGN case studies, then let weak-area review route the next question.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-[14px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-3 sm:rounded-[18px] sm:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Live bank</span>
                <strong className="mt-1.5 block text-lg text-dark sm:mt-2 sm:text-2xl">{heroMetric}</strong>
                <p className="mt-1 text-[11px] leading-4 text-muted">questions with rationale + citations</p>
              </div>
              <div className="rounded-[14px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-3 sm:rounded-[18px] sm:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Readiness exams</span>
                <strong className="mt-1.5 block text-lg text-dark sm:mt-2 sm:text-2xl">5 timed sims</strong>
                <p className="mt-1 text-[11px] leading-4 text-muted">full Pearson-style chrome & debrief</p>
              </div>
              <div className="rounded-[14px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-3 sm:rounded-[18px] sm:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Start from</span>
                <strong className="mt-1.5 block text-lg text-dark sm:mt-2 sm:text-2xl">$4.99</strong>
                <p className="mt-1 text-[11px] leading-4 text-muted">7-day pass, no auto-renew</p>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              {practiceModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Link
                    key={mode.label}
                    href={mode.href}
                    className="group flex items-center justify-between gap-3 rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-white/72 px-3.5 py-3 transition hover:border-[rgba(90,127,136,0.22)] hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(90,127,136,0.1)] text-[#4f6f77]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <strong className="text-sm font-semibold text-dark">{mode.label}</strong>
                        <p className="text-xs leading-5 text-muted">{mode.body}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-dark" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* RIGHT: subject lanes + realistic Pearson-style NCLEX simulator */}
          <div className="p-5 sm:p-6 md:p-7 lg:p-8">
            <div className="grid gap-4 md:grid-cols-[minmax(220px,0.78fr)_1.22fr] md:gap-5">
              {/* Subject lanes (all categories) */}
              <div className="rounded-[20px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-4 shadow-[0_14px_34px_rgba(31,38,43,0.04)] md:rounded-[24px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Study by subject</p>
                    <h3 className="mt-2 font-serif text-[1.55rem] leading-[1] text-dark">{activeLaneLabel}</h3>
                  </div>
                  <Link href={`/quiz?exam=${activeExam}&mode=standard`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(74,85,89,0.12)] bg-white text-dark" aria-label={`Open ${activeExam.toUpperCase()} subject practice`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 grid gap-1.5">
                  {activeSubjectRows.map((row, index) => (
                    <Link
                      key={row.label}
                      href={`/quiz?exam=${activeExam}&mode=standard&category=${row.key}`}
                      className="group rounded-[14px] border border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.9)] px-3 py-2.5 transition hover:border-[rgba(90,127,136,0.22)] hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-semibold text-dark">{row.label}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted">{row.count}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Realistic NCLEX simulator chrome */}
              <div className="min-w-0 overflow-hidden rounded-[16px] border border-[#cbd5dc] bg-[#f4f5f7] shadow-[0_18px_42px_rgba(31,38,43,0.14)] md:rounded-[20px]">
                {/* Pearson-style top status bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5dc] bg-[linear-gradient(180deg,#22405a,#1b3349)] px-3 py-2 text-white sm:gap-3 sm:px-3.5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">NCLEX-RN</span>
                    <span className="hidden text-[11px] font-medium text-white/75 sm:inline">Candidate: A. Mello</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-white/85 sm:gap-4">
                    <span>Item <strong className="text-white">47</strong> of 85</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-[#d5ae63]" />
                      <strong className="tabular-nums text-white">3:42:18</strong>
                    </span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5dc] bg-white px-3.5 py-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#3d4a52]">
                    <button type="button" className="inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#f4f5f7] px-2 py-1 hover:bg-white">
                      <Calculator className="h-3.5 w-3.5" /> Calculator
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#f4f5f7] px-2 py-1 hover:bg-white">
                      <Maximize2 className="h-3.5 w-3.5" /> Exhibit
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#f4f5f7] px-2 py-1 hover:bg-white">
                      <Highlighter className="h-3.5 w-3.5" /> Highlight
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#f4f5f7] px-2 py-1 hover:bg-white">
                      <Strikethrough className="h-3.5 w-3.5" /> Strike
                    </button>
                  </div>
                  <button type="button" className="inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#fff7e6] px-2 py-1 text-[11px] font-semibold text-[#8d6a2e] hover:bg-[#fdedc4]">
                    <Flag className="h-3.5 w-3.5" /> Flag for review
                  </button>
                </div>

                {/* Chart tabs + case progress */}
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#cbd5dc] bg-[#eef1f4] px-2 pt-2">
                  <div className="flex flex-wrap gap-0">
                    {chartTabs.map((tab, idx) => {
                      const Icon = tab.icon;
                      const isActive = idx === 1;
                      return (
                        <span
                          key={tab.key}
                          className={`inline-flex items-center gap-1.5 rounded-t border border-b-0 px-2 py-1.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${
                            isActive
                              ? "border-[#cbd5dc] bg-white text-[#1b3349]"
                              : "border-transparent text-[#5e6e78] hover:text-[#1b3349]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="mb-1 flex items-center gap-1 pr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">
                    <span className="hidden sm:inline">Case progress</span>
                    {[true, true, true, false, false, false].map((done, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-3 rounded-full sm:w-4 ${done ? "bg-[#22405a]" : "bg-[#cbd5dc]"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Item body */}
                <div className="grid gap-0 bg-white md:grid-cols-[0.95fr_1.05fr]">
                  {/* Left pane: Nurses' notes - EHR-style timestamped entries */}
                  <div className="border-b border-[#e3e7eb] p-4 md:border-b-0 md:border-r">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5e6e78]">Nurses' Notes</p>
                      <span className="text-[10px] text-[#5e6e78]">Day 1 / 12-hr shift</span>
                    </div>
                    <div className="mt-2 space-y-2 text-[12.5px] leading-6 text-[#1b3349]">
                      <div className="rounded-md border border-[#e3e7eb] bg-[#f8fafb] p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">0700 / Admission</p>
                        <p className="mt-1">52-year-old reports 2 days of progressive <mark className="bg-[#fff1bf] px-0.5">dyspnea on exertion</mark> and right calf pain. Recent <mark className="bg-[#fff1bf] px-0.5">9-hour flight</mark> 4 days ago. Denies chest pain. Anxious.</p>
                      </div>
                      <div className="rounded-md border border-[#e3e7eb] bg-[#f8fafb] p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">0830 / Assessment</p>
                        <p className="mt-1"><mark className="bg-[#fff1bf] px-0.5">SpO2 88% on room air</mark>, HR 124, RR 28, BP 102/64. Right lower extremity warm, edematous, tender. Lungs clear bilaterally.</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-[#e3e7eb] bg-white p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">Labs - flagged</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#1b3349]">
                        <div className="flex items-center justify-between"><span className="text-[#5e6e78]">D-dimer</span><strong className="text-[#a33b2e]">5.8 high</strong></div>
                        <div className="flex items-center justify-between"><span className="text-[#5e6e78]">Troponin</span><strong>&lt;0.01</strong></div>
                        <div className="flex items-center justify-between"><span className="text-[#5e6e78]">BNP</span><strong>94</strong></div>
                        <div className="flex items-center justify-between"><span className="text-[#5e6e78]">ABG pH</span><strong className="text-[#a33b2e]">7.48 high</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Right pane: NGN bowtie */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-[#22405a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Bowtie</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">NGN case / item 4 of 6</span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-6 text-[#1b3349]">
                      Complete the diagram by selecting from the choice lists. The condition the client is most likely experiencing, two priority actions, and two parameters to monitor.
                    </p>

                    {/* Bowtie diagram with connecting lines */}
                    <div className="relative mt-3">
                      <svg
                        viewBox="0 0 320 120"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        aria-hidden="true"
                      >
                        <path d="M70 28 L155 60" stroke="#5A7F88" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <path d="M70 92 L155 60" stroke="#5A7F88" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <path d="M165 60 L250 28" stroke="#C29A56" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <path d="M165 60 L250 92" stroke="#C29A56" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                      </svg>
                      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="grid gap-1.5">
                          <div className="rounded-md border border-[#5A7F88] bg-[#eef5f4] px-2 py-1.5 text-[11px] font-semibold text-[#1b3349]">Administer O2</div>
                          <div className="rounded-md border border-[#5A7F88] bg-[#eef5f4] px-2 py-1.5 text-[11px] font-semibold text-[#1b3349]">Anticoagulation</div>
                        </div>
                        <div className="rounded-md border-2 border-[#22405a] bg-white px-3 py-2 text-center shadow-sm">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">Condition</p>
                          <strong className="text-[12px] text-[#1b3349]">Pulmonary embolism</strong>
                        </div>
                        <div className="grid gap-1.5">
                          <div className="rounded-md border border-[#C29A56] bg-[#fdf3e0] px-2 py-1.5 text-[11px] font-semibold text-[#1b3349]">SpO2 + RR</div>
                          <div className="rounded-md border border-[#C29A56] bg-[#fdf3e0] px-2 py-1.5 text-[11px] font-semibold text-[#1b3349]">aPTT / anti-Xa</div>
                        </div>
                      </div>
                      <div className="relative mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">
                        <span className="text-center text-[#4f6f77]">Actions to take</span>
                        <span />
                        <span className="text-center text-[#8d6a2e]">Parameters to monitor</span>
                      </div>
                    </div>

                    {/* Choice menus styled like Pearson dropdowns */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded border border-[#cbd5dc] bg-white p-2 shadow-[0_2px_6px_rgba(31,38,43,0.04)]">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">Condition menu</p>
                        <ul className="mt-1 space-y-0.5 text-[#1b3349]">
                          <li className="flex items-center justify-between rounded bg-[#22405a] px-1.5 py-0.5 text-white">
                            <span>Pulmonary embolism</span>
                            <CheckCircle2 className="h-3 w-3" />
                          </li>
                          <li className="px-1.5 py-0.5 text-[#5e6e78]">Acute MI</li>
                          <li className="px-1.5 py-0.5 text-[#5e6e78]">Pneumothorax</li>
                          <li className="px-1.5 py-0.5 text-[#5e6e78]">Heart failure</li>
                        </ul>
                      </div>
                      <div className="rounded border border-[#cbd5dc] bg-white p-2 shadow-[0_2px_6px_rgba(31,38,43,0.04)]">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">Actions / monitors menu</p>
                        <ul className="mt-1 space-y-0.5 text-[#1b3349]">
                          <li className="flex items-center justify-between rounded bg-[rgba(90,127,136,0.16)] px-1.5 py-0.5">
                            <span>Administer O2</span><CheckCircle2 className="h-3 w-3 text-[#4f6f77]" />
                          </li>
                          <li className="flex items-center justify-between rounded bg-[rgba(90,127,136,0.16)] px-1.5 py-0.5">
                            <span>Anticoagulation</span><CheckCircle2 className="h-3 w-3 text-[#4f6f77]" />
                          </li>
                          <li className="flex items-center justify-between rounded bg-[rgba(194,154,86,0.18)] px-1.5 py-0.5">
                            <span>SpO2 + RR</span><CheckCircle2 className="h-3 w-3 text-[#8d6a2e]" />
                          </li>
                          <li className="flex items-center justify-between rounded bg-[rgba(194,154,86,0.18)] px-1.5 py-0.5">
                            <span>aPTT / anti-Xa</span><CheckCircle2 className="h-3 w-3 text-[#8d6a2e]" />
                          </li>
                          <li className="px-1.5 py-0.5 text-[#5e6e78]">Daily weight</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item palette navigator (Pearson-style) */}
                <div className="border-t border-[#cbd5dc] bg-white px-3 py-2.5 sm:px-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">Item navigator</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#5e6e78]">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#22405a]" /> answered</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#d5ae63]" /> flagged</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-[#22405a] bg-white" /> current</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#e3e7eb]" /> unseen</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-[repeat(17,minmax(0,1fr))] gap-[3px] sm:grid-cols-[repeat(25,minmax(0,1fr))] md:grid-cols-[repeat(30,minmax(0,1fr))]">
                    {Array.from({ length: 85 }).map((_, i) => {
                      const n = i + 1;
                      const flagged = [12, 23, 38, 61].includes(n);
                      const answered = n < 47 && !flagged;
                      const current = n === 47;
                      return (
                        <span
                          key={i}
                          className={`flex h-4 items-center justify-center rounded-[2px] text-[8px] font-semibold sm:h-[18px] sm:text-[9px] ${
                            current
                              ? "border border-[#22405a] bg-white text-[#22405a]"
                              : flagged
                              ? "bg-[#d5ae63] text-white"
                              : answered
                              ? "bg-[#22405a] text-white"
                              : "bg-[#e3e7eb] text-[#5e6e78]"
                          }`}
                        >
                          {n}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between gap-3 border-t border-[#cbd5dc] bg-[#eef1f4] px-3.5 py-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5e6e78]">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#8d6a2e]" />
                    Confirm before navigating away
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded border border-[#cbd5dc] bg-white px-3 py-1 text-[11px] font-semibold text-[#1b3349]">Previous</button>
                    <button type="button" className="rounded bg-[#22405a] px-4 py-1 text-[11px] font-semibold text-white">Next -&gt;</button>
                  </div>
                </div>
              </div>
            </div>

            {/* NGN format previews */}
            <div className="mt-5 rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-white/82 p-4 shadow-[0_14px_34px_rgba(31,38,43,0.04)] sm:rounded-[20px]">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">NGN format previews</p>
                  <h3 className="mt-1 font-serif text-[clamp(1.2rem,2vw,1.55rem)] leading-[1.15] text-dark">Drill the exact item types that count on test day.</h3>
                </div>
                <span className="rounded-full border border-[rgba(194,154,86,0.25)] bg-[rgba(194,154,86,0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d6a2e]">7 NGN previews / exam-mode scoring</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {/* Bowtie mini */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Bowtie</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8d6a2e]">5-step</span>
                  </div>
                  <div className="relative mt-3 h-[68px]">
                    <svg viewBox="0 0 220 68" className="absolute inset-0 h-full w-full" aria-hidden="true">
                      <path d="M40 14 L100 34" stroke="#5A7F88" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                      <path d="M40 54 L100 34" stroke="#5A7F88" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                      <path d="M120 34 L180 14" stroke="#C29A56" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                      <path d="M120 34 L180 54" stroke="#C29A56" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                      <rect x="2" y="6" width="44" height="16" rx="3" fill="#eef5f4" stroke="#5A7F88" />
                      <rect x="2" y="46" width="44" height="16" rx="3" fill="#eef5f4" stroke="#5A7F88" />
                      <rect x="86" y="22" width="48" height="24" rx="4" fill="#fff" stroke="#22405a" strokeWidth="1.5" />
                      <rect x="174" y="6" width="44" height="16" rx="3" fill="#fdf3e0" stroke="#C29A56" />
                      <rect x="174" y="46" width="44" height="16" rx="3" fill="#fdf3e0" stroke="#C29A56" />
                    </svg>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-muted">Condition / 2 actions / 2 monitors</p>
                </div>

                {/* Cloze drop-down */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Cloze drop-down</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">inline</span>
                  </div>
                  <div className="mt-3 text-[11px] leading-5 text-[#1b3349]">
                    The nurse expects
                    <span className="mx-1 inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#f4f5f7] px-1.5 py-0.5 text-[10px] font-semibold">
                      pulmonary embolism <ChevronRight className="h-2.5 w-2.5 rotate-90" />
                    </span>
                    caused by
                    <span className="mx-1 inline-flex items-center gap-1 rounded border border-[#cbd5dc] bg-[#f4f5f7] px-1.5 py-0.5 text-[10px] font-semibold">
                      DVT <ChevronRight className="h-2.5 w-2.5 rotate-90" />
                    </span>
                    after prolonged immobility.
                  </div>
                </div>

                {/* Matrix multiple response */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Matrix MR</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">multi-pick</span>
                  </div>
                  <div className="mt-3 overflow-hidden rounded border border-[#e3e7eb] text-[10px]">
                    <div className="grid grid-cols-4 bg-[#eef1f4] font-semibold text-[#5e6e78]">
                      <span className="px-1.5 py-1">Finding</span><span className="px-1.5 py-1 text-center">Exp.</span><span className="px-1.5 py-1 text-center">Unexp.</span><span className="px-1.5 py-1 text-center">N/A</span>
                    </div>
                    {([["SpO2 88%", 1], ["HR 124", 1], ["Calf pain", 1], ["BNP 94", 2]] as Array<[string, number]>).map(([k, sel], i) => (
                      <div key={i} className="grid grid-cols-4 border-t border-[#e3e7eb] text-[#1b3349]">
                        <span className="px-1.5 py-1">{k}</span>
                        {[0,1,2].map((c) => (
                          <span key={c} className="border-l border-[#e3e7eb] px-1.5 py-1 text-center">
                            {sel === c + 1 ? <CheckCircle2 className="mx-auto h-3 w-3 text-[#22405a]" /> : <span className="inline-block h-2.5 w-2.5 rounded-full border border-[#cbd5dc]" />}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlight text */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Highlight text</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">click cues</span>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-[#1b3349]">
                    Client reports <mark className="bg-[#fff1bf] px-0.5">sudden dyspnea</mark>, HR 124, <mark className="bg-[#fff1bf] px-0.5">SpO2 88%</mark>, and right calf is <mark className="bg-[#fff1bf] px-0.5">warm and tender</mark>.
                  </p>
                  <p className="mt-2 text-[10px] text-[#8d6a2e]">3 of 4 cues selected</p>
                </div>

                {/* Drag and drop */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Drag &amp; drop</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">sequencing</span>
                  </div>
                  <ol className="mt-3 space-y-1 text-[11px] text-[#1b3349]">
                    {["Apply oxygen", "Notify provider", "Initiate anticoagulation", "Reassess SpO2"].map((s, i) => (
                      <li key={s} className="flex items-center gap-2 rounded border border-[#e3e7eb] bg-[#f8fafb] px-2 py-1">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#22405a] text-[9px] font-semibold text-white">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Extended MR */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Extended MR</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">select N</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-[11px] text-[#1b3349]">
                    {([["Dyspnea", true], ["Tachycardia", true], ["Crushing chest pain", false], ["Unilateral leg swelling", true], ["Bradycardia", false]] as Array<[string, boolean]>).map(([k, on], i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${on ? "border-[#22405a] bg-[#22405a]" : "border-[#cbd5dc] bg-white"}`}>
                          {on ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> : null}
                        </span>
                        <span className={on ? "" : "text-[#5e6e78]"}>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trend chart */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Trend</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">SpO2 / 6h</span>
                  </div>
                  <svg viewBox="0 0 220 80" className="mt-3 h-[70px] w-full" aria-hidden="true">
                    <line x1="20" y1="60" x2="210" y2="60" stroke="#e3e7eb" />
                    <line x1="20" y1="40" x2="210" y2="40" stroke="#eef1f4" />
                    <line x1="20" y1="20" x2="210" y2="20" stroke="#eef1f4" />
                    <polyline points="20,18 60,22 100,32 140,46 180,58 210,62" fill="none" stroke="#22405a" strokeWidth="2" />
                    {([[20,18],[60,22],[100,32],[140,46],[180,58],[210,62]] as Array<[number, number]>).map(([x,y],i)=>(
                      <circle key={i} cx={x} cy={y} r="3" fill="#22405a" />
                    ))}
                    <text x="20" y="76" fill="#5e6e78" fontSize="8">0700</text>
                    <text x="180" y="76" fill="#5e6e78" fontSize="8">1300</text>
                    <text x="0" y="22" fill="#5e6e78" fontSize="8">98</text>
                    <text x="0" y="62" fill="#a33b2e" fontSize="8">88</text>
                  </svg>
                </div>

                {/* Standard MC for completeness */}
                <div className="rounded-[14px] border border-[rgba(74,85,89,0.1)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-[12px] font-semibold text-dark">Standard MC</strong>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4f6f77]">single best</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-[11px] text-[#1b3349]">
                    {([["A", "Apply 2 L NC", false], ["B", "Administer O2 to keep SpO2 >= 94%", true], ["C", "Re-position prone", false], ["D", "Encourage ambulation", false]] as Array<[string, string, boolean]>).map(([letter, body, on], i) => (
                      <li key={i} className={`flex items-center gap-2 rounded px-1.5 py-1 ${on ? "bg-[rgba(34,64,90,0.08)]" : ""}`}>
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold ${on ? "border-[#22405a] bg-[#22405a] text-white" : "border-[#cbd5dc] text-[#5e6e78]"}`}>{letter}</span>
                        <span>{body}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* After-every-item rail */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-[rgba(31,38,43,0.92)] p-4 text-white">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#d5ae63]" />
                  <strong className="text-sm">Deep rationale + citations</strong>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-white/64">Correct-answer logic, distractor traps, learning points, and source links.</p>
              </div>
              <div className="rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-[rgba(31,38,43,0.92)] p-4 text-white">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#d5ae63]" />
                  <strong className="text-sm">AI tutor handoff</strong>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-white/64">Ask from the exact item, chart, and rationale - no copy-paste.</p>
              </div>
              <div className="rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-[rgba(31,38,43,0.92)] p-4 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#d5ae63]" />
                  <strong className="text-sm">Weak-area review</strong>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-white/64">Missed items route into the adaptive queue on the study dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
