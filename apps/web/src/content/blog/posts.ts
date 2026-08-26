/**
 * Blog post registry — the single source of truth for /blog.
 *
 * HOW TO ADD A POST (hermes, codex, or any agent):
 *   Append a new object to `blogPosts` below. That's it — the index page,
 *   the /blog/[slug] page, and the sitemap all pick it up automatically.
 *   Content is bundled at build time (no runtime filesystem reads), so it
 *   renders reliably on Cloudflare Workers.
 *
 * Body blocks supported: { type: "h2" | "p" | "ul", ... }. Keep paragraphs
 * plain text (no raw HTML) so output stays safe and on-brand.
 */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date, e.g. "2026-05-21" */
  date: string;
  author: string;
  exam?: "nclex" | "ccrn" | "both";
  /** Short read-time label, e.g. "5 min read" */
  readingTime?: string;
  tags: string[];
  relatedLinks?: Array<{ href: string; label: string }>;
  body: BlogBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "top-ten-free-nclex-study-tools-best-free-practice-questions",
    title: "Top Ten Free NCLEX Study Tools",
    description:
      "A practical guide to free NCLEX practice tools, daily questions, NGN exposure, rationales, readiness exams, and how to turn free study time into a focused plan.",
    date: "2026-06-04",
    author: "Clarity Clinical Prep",
    exam: "nclex",
    readingTime: "8 min read",
    tags: ["Free NCLEX practice", "NCLEX questions", "NGN"],
    relatedLinks: [
      { href: "/", label: "ClarityNCLEX home" },
      { href: "/free/nclex-practice-questions", label: "Free NCLEX practice questions" },
      { href: "/quiz", label: "Start a practice session" },
    ],
    body: [
      {
        type: "p",
        text: "Free NCLEX tools are useful when they help you practice the same decisions the exam asks you to make: notice the risky cue, choose the safest nursing priority, and learn why the wrong options are wrong. The best free tools are not just question counters. They give you realistic formats, clear rationales, and a next step after each miss.",
      },
      { type: "h2", text: "1. ClarityNCLEX free daily practice" },
      {
        type: "p",
        text: "ClarityNCLEX is built around daily NCLEX practice with rationales, NGN-style exposure, and weak-area tracking. Use the free practice path when you need a low-friction way to start, then move into timed practice when you want pressure closer to exam day.",
      },
      { type: "h2", text: "2. NCSBN sample items" },
      {
        type: "p",
        text: "Official sample items help you understand how NGN item formats are framed. They are best used as calibration: review the format, then continue with a larger bank so you can build stamina and pattern recognition across client needs.",
      },
      { type: "h2", text: "3. Free question banks from established prep brands" },
      {
        type: "p",
        text: "Competitor free trials can be useful for comparison. Focus less on the number of free questions and more on whether each rationale teaches a transferable rule, such as airway before education, unstable circulation before routine comfort, or contraindication before convenience.",
      },
      { type: "h2", text: "4. Readiness exam previews" },
      {
        type: "p",
        text: "A readiness exam is different from a casual quiz. It should be timed, mixed, and long enough to expose fatigue errors. Save readiness-style practice for checkpoints, not every day, so the result gives you a meaningful signal.",
      },
      { type: "h2", text: "5. NGN case study practice" },
      {
        type: "p",
        text: "Case studies are where many students discover that knowing facts is not enough. You need to connect labs, vitals, medications, orders, and assessment changes into one clinical judgment. Free NGN practice should include at least some unfolding cases, not only standalone multiple choice.",
      },
      { type: "h2", text: "6. SATA and matrix drills" },
      {
        type: "p",
        text: "Select-all and matrix questions are useful when they force you to judge each option independently. Treat every row or option as true or false against the stem instead of hunting for a familiar-looking pattern.",
      },
      { type: "h2", text: "7. Pharmacology review cards" },
      {
        type: "p",
        text: "Drug cards work best when they are tied to nursing action: priority labs, adverse effects, contraindications, antidotes, and teaching points. Memorizing drug classes without action steps rarely transfers well to NCLEX-style questions.",
      },
      { type: "h2", text: "8. Lab value refreshers" },
      {
        type: "p",
        text: "Lab tools are most helpful when they connect abnormal values to the likely nursing priority. Do not stop at naming the abnormal lab. Ask what the nurse should assess, hold, report, or prepare for next.",
      },
      { type: "h2", text: "9. Prioritization and delegation drills" },
      {
        type: "p",
        text: "Prioritization questions reward safety language. Watch for unstable findings, new changes, airway or perfusion threats, abnormal bleeding, infection risk, and tasks that require RN judgment instead of delegation.",
      },
      { type: "h2", text: "10. A dashboard that tells you what to do next" },
      {
        type: "p",
        text: "The best free practice does not leave you guessing. After a session, you should know your weak categories, due review items, and whether you should drill content, work NGN cases, or take a timed readiness exam.",
      },
    ],
  },
  {
    slug: "nclex-test-taking-strategies-10-proven-tactics-to-pass-on-first-try",
    title: "NCLEX Test-Taking Strategies: 10 Proven Tactics to Pass on the First Try",
    description:
      "Ten practical NCLEX test-taking strategies for prioritization, NGN case studies, SATA, safety questions, and timed readiness practice.",
    date: "2026-06-03",
    author: "Clarity Clinical Prep",
    exam: "nclex",
    readingTime: "7 min read",
    tags: ["NCLEX strategy", "Readiness exam", "Prioritization"],
    relatedLinks: [
      { href: "/", label: "ClarityNCLEX home" },
      { href: "/free/nclex-prep", label: "Free NCLEX prep guide" },
      { href: "/quiz", label: "Practice these strategies" },
    ],
    body: [
      {
        type: "p",
        text: "NCLEX strategy is not about tricks. It is about making the safest nursing decision with incomplete information. The strongest test takers read for instability, separate assessment from intervention, and use rationales to repair the thinking pattern behind each miss.",
      },
      { type: "h2", text: "1. Decide what is unstable before reading every option" },
      {
        type: "p",
        text: "Look first for airway, breathing, circulation, neurologic change, sepsis clues, bleeding, allergic reaction, hypoglycemia, overdose, or acute deterioration. These cues usually outrank routine teaching or comfort measures.",
      },
      { type: "h2", text: "2. Use assessment before action when the problem is unclear" },
      {
        type: "p",
        text: "If the stem does not give enough information to act safely, the best answer often collects the missing assessment. If the stem already shows a clear emergency, delaying for more assessment can be unsafe.",
      },
      { type: "h2", text: "3. Treat each SATA option as its own true-false question" },
      {
        type: "p",
        text: "Do not count how many options you expect to choose. Compare each option directly to the stem and eliminate anything that is partly wrong, too broad, or mismatched to the priority problem.",
      },
      { type: "h2", text: "4. In NGN cases, follow the timeline" },
      {
        type: "p",
        text: "The most recent assessment, vital sign trend, or new order usually matters more than an older stable finding. Track what changed and ask why that change matters now.",
      },
      { type: "h2", text: "5. Know when delegation is unsafe" },
      {
        type: "p",
        text: "Tasks requiring assessment, evaluation, teaching, clinical judgment, or unstable-patient care stay with the RN. Stable, routine, predictable tasks are more appropriate for delegation.",
      },
      { type: "h2", text: "6. Translate labs into nursing action" },
      {
        type: "p",
        text: "An abnormal lab is only half the question. Ask what it means for safety: bleeding risk, dysrhythmia risk, infection risk, respiratory compromise, medication toxicity, or fluid imbalance.",
      },
      { type: "h2", text: "7. Avoid answers that delay the priority" },
      {
        type: "p",
        text: "Education, documentation, reassurance, and routine follow-up can be correct later but wrong first. If a patient is unstable, the first action should address the immediate risk.",
      },
      { type: "h2", text: "8. Review every distractor" },
      {
        type: "p",
        text: "A premium rationale should explain why the correct option is safest and why each wrong option fails. That is where most score improvement happens, especially for students stuck between two choices.",
      },
      { type: "h2", text: "9. Take timed readiness exams sparingly" },
      {
        type: "p",
        text: "Use readiness exams as checkpoints after focused review blocks. If you take them too often, they become another question drill instead of a realistic measure of stamina and mixed-category decision-making.",
      },
      { type: "h2", text: "10. Let weak areas choose the next session" },
      {
        type: "p",
        text: "The fastest plan is not always more questions. It is the right next set: missed category, missed client need, missed NGN step, or due review. Personalization matters because the NCLEX is testing judgment under pressure, not broad exposure alone.",
      },
    ],
  },
  {
    slug: "free-nclex-practice-questions-how-to-use-them",
    title: "Free NCLEX Practice Questions: How to Use Them Without Wasting Time",
    description:
      "How to turn free NCLEX practice questions into measurable progress by reviewing rationales, tracking weak areas, and rotating NGN formats.",
    date: "2026-06-15",
    author: "Clarity Clinical Prep",
    exam: "nclex",
    readingTime: "6 min read",
    tags: ["Free NCLEX practice", "Rationales", "Study plan"],
    relatedLinks: [
      { href: "/", label: "ClarityNCLEX home" },
      { href: "/free/nclex-practice-questions", label: "Free NCLEX practice questions" },
      { href: "/free/nclex-ngn-questions", label: "Free NGN questions" },
    ],
    body: [
      {
        type: "p",
        text: "Free NCLEX questions are most valuable when they create a feedback loop. Answer the item, read the rationale, name the missed cue, and choose the next session from that weakness instead of simply starting another random quiz.",
      },
      { type: "h2", text: "Start with mixed practice, then narrow the target" },
      {
        type: "p",
        text: "A mixed set reveals whether the miss is content, priority-setting, or format confusion. After that, narrow your next set to the weak area: pharmacology, safety, prioritization, delegation, labs, or an NGN format such as matrix or case study.",
      },
      { type: "h2", text: "Use rationales as the study material" },
      {
        type: "p",
        text: "The answer explanation should teach the clinical mechanism, the safety priority, and the distractor error. If you cannot explain why each wrong answer is wrong, the question has not finished teaching you yet.",
      },
      { type: "h2", text: "Keep a short miss log" },
      {
        type: "ul",
        items: [
          "What cue did I miss?",
          "Was the problem content knowledge, priority order, or question format?",
          "What would make me pick the safe answer next time?",
          "Which category should I practice next?",
        ],
      },
    ],
  },
  {
    slug: "ngn-case-study-practice-how-to-review",
    title: "NGN Case Study Practice: How to Review Each Step",
    description:
      "A simple review method for NGN case studies: cues, hypotheses, solutions, nursing actions, outcomes, and partial-credit thinking.",
    date: "2026-06-15",
    author: "Clarity Clinical Prep",
    exam: "nclex",
    readingTime: "6 min read",
    tags: ["NGN", "Case studies", "Clinical judgment"],
    relatedLinks: [
      { href: "/", label: "ClarityNCLEX home" },
      { href: "/free/nclex-case-studies", label: "Free NCLEX case studies" },
      { href: "/quiz", label: "Start NGN practice" },
    ],
    body: [
      {
        type: "p",
        text: "NGN case studies test a chain of thinking. A student can know the disease and still miss points by choosing the wrong cue, prioritizing the wrong hypothesis, or monitoring the wrong outcome after an intervention.",
      },
      { type: "h2", text: "Review by clinical judgment step" },
      {
        type: "ul",
        items: [
          "Recognize cues: Which findings were abnormal, new, or high risk?",
          "Analyze cues: What pattern did those findings create?",
          "Prioritize hypotheses: Which problem could harm the patient first?",
          "Generate solutions: Which interventions match that problem?",
          "Take action: Which action is safe now?",
          "Evaluate outcomes: Which finding proves the intervention worked or failed?",
        ],
      },
      { type: "h2", text: "Do not skip partial-credit review" },
      {
        type: "p",
        text: "Partial credit can hide weak thinking. Review the options you missed and the options you selected incorrectly. Both matter because NCLEX-style scoring rewards precision, not just general familiarity.",
      },
      { type: "h2", text: "Make the next set specific" },
      {
        type: "p",
        text: "If you missed cues, drill assessment patterns. If you missed actions, drill prioritization and delegation. If you missed evaluation, review outcomes and complications for the condition.",
      },
    ],
  },
  {
    slug: "how-to-study-for-the-nclex-without-burning-out",
    title: "How to study for the NCLEX without burning out",
    description:
      "A calmer, evidence-aligned NCLEX study plan: spaced practice, NGN case work, and weak-area review instead of marathon cram sessions.",
    date: "2026-05-20",
    author: "Clarity Clinical Prep",
    exam: "nclex",
    readingTime: "6 min read",
    tags: ["NCLEX", "Study plan", "NGN"],
    body: [
      {
        type: "p",
        text: "Most NCLEX burnout comes from doing more questions, not better ones. The exam rewards clinical judgment under uncertainty, so your study time should look like the test: short, focused reps with honest review of why an answer was right or wrong.",
      },
      { type: "h2", text: "Practice the way you test" },
      {
        type: "p",
        text: "Next Generation NCLEX (NGN) leans on case studies, bow-tie, matrix, and select-all formats. If you only drill standalone multiple-choice, you train a skill the exam no longer emphasizes. Spend real time inside unfolding cases with shared exhibits, vitals, and orders.",
      },
      { type: "h2", text: "A weekly rhythm that holds up" },
      {
        type: "ul",
        items: [
          "Three to five short sessions per week beat one long cram block.",
          "Review every miss until you can explain the distractor traps out loud.",
          "Let weak-area analytics route your next session instead of guessing.",
          "Protect sleep the week of the exam — recall depends on it.",
        ],
      },
      { type: "h2", text: "Make rationales do the teaching" },
      {
        type: "p",
        text: "A good rationale explains the correct-answer logic, names the distractor traps, and links to a source. That is the difference between memorizing an answer and learning the clinical reasoning that transfers to the next item — and to the floor.",
      },
    ],
  },
  {
    slug: "ngn-case-studies-explained",
    title: "NGN case studies, explained simply",
    description:
      "What Next Generation NCLEX case studies actually test, the item types you will see, and how to work them without second-guessing.",
    date: "2026-05-18",
    author: "Clarity Clinical Prep",
    exam: "nclex",
    readingTime: "5 min read",
    tags: ["NGN", "Case studies", "Clinical judgment"],
    body: [
      {
        type: "p",
        text: "NGN case studies present a patient, then unfold across several linked items that share the same chart. They are designed to measure the clinical judgment model: recognizing cues, analyzing them, prioritizing hypotheses, planning, acting, and evaluating.",
      },
      { type: "h2", text: "The item types to expect" },
      {
        type: "ul",
        items: [
          "Bow-tie: pick the condition, the priority actions, and the parameters to monitor.",
          "Matrix / multiple response: classify findings as expected, unexpected, or unrelated.",
          "Cloze drop-down: complete a sentence with the clinically correct options.",
          "Highlight: select the cues in a note that matter most.",
          "Drag-and-drop ordering: sequence interventions safely.",
        ],
      },
      { type: "h2", text: "How to work a case calmly" },
      {
        type: "p",
        text: "Read the most recent assessment first, then anchor on the unstable hemodynamic or airway clue. Decide what the patient most likely has before you touch the answer choices — the cases are built to reward a clear hypothesis, not pattern-matching.",
      },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
