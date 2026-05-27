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
  body: BlogBlock[];
};

export const blogPosts: BlogPost[] = [
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
