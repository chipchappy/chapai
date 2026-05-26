import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_ENDOCRINE } from "@/content/free-landings/extra-questions";
import { SEED_CASE_STUDIES } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-endocrine-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Endocrine Questions | DKA, Thyroid Storm, Addisonian Crisis",
  description:
    "Free NCLEX-RN endocrine practice questions: DKA priorities, post-thyroidectomy airway, Addisonian crisis. Full rationales for every distractor.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX endocrine questions",
    "NCLEX DKA questions",
    "NCLEX endocrine practice",
    "free nursing endocrine NCLEX",
    "NCLEX thyroid questions",
  ],
  openGraph: {
    title: "Free NCLEX Endocrine Questions",
    description: "DKA, thyroid storm, Addisonian crisis. Free rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [SEED_ENDOCRINE[0], SEED_ENDOCRINE[1], SEED_ENDOCRINE[2], SEED_CASE_STUDIES[2]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX endocrine questions with full rationales"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Four free NCLEX-RN endocrine emergency questions covering DKA fluid resuscitation
          priorities, post-thyroidectomy airway compromise, Addisonian crisis, and insulin
          management during hypokalemia.
        </p>
      }
      body={
        <>
          <h2>Top endocrine NCLEX topics</h2>
          <ul>
            <li><strong>DKA vs HHS.</strong> DKA: type 1, glucose 250–600, pH &lt; 7.3, ketones. HHS: type 2, glucose &gt; 600, pH normal, no ketones. Both need fluids first, then insulin, then K+ replacement.</li>
            <li><strong>Hypoglycemia.</strong> Glucose &lt; 70 with symptoms. Conscious + can swallow → 15 g fast carbs. Unconscious → IM glucagon or IV dextrose.</li>
            <li><strong>Thyroid storm.</strong> Hyperthermia, tachyarrhythmia, agitation. Beta-blockers, PTU/methimazole, cooling, IV fluids.</li>
            <li><strong>Myxedema coma.</strong> Hypothermia, bradycardia, hypotension, altered mental status. IV levothyroxine, gentle rewarming.</li>
            <li><strong>SIADH vs DI.</strong> SIADH: too much ADH, dilutional hyponatremia, fluid restriction. DI: too little ADH, polyuria of dilute urine, desmopressin.</li>
            <li><strong>Addisonian crisis.</strong> Cortisol deficiency: hypotension, hyperkalemia, hyponatremia, hypoglycemia. Immediate IV hydrocortisone + fluids.</li>
            <li><strong>Cushing's syndrome.</strong> Cortisol excess: moon face, buffalo hump, striae, hyperglycemia. Surgical or medical management.</li>
          </ul>

          <h2>The 4 endocrine emergencies that absolutely appear on NCLEX</h2>
          <ol>
            <li><strong>DKA.</strong> Fluids → insulin → K+ replacement. Watch for cerebral edema in pediatrics (do not drop glucose faster than 50–75 mg/dL/hr).</li>
            <li><strong>Hypoglycemia.</strong> Treat immediately. Don't delay for repeat glucose check.</li>
            <li><strong>Post-thyroidectomy.</strong> Stridor = airway emergency. Watch for hypocalcemia (parathyroid injury).</li>
            <li><strong>Addisonian crisis.</strong> IV hydrocortisone first, fluids next. Don't fluid-restrict.</li>
          </ol>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "What's the priority in DKA treatment?", answer: "Fluids first. IV NS 1 L bolus before starting insulin. Insulin without volume resuscitation can drop perfusion and worsen acidosis. Then continuous IV insulin at 0.1 units/kg/hr. Then potassium replacement as it drops with insulin." },
        { question: "When do I worry about a thyroidectomy patient?", answer: "Stridor or difficulty swallowing post-thyroidectomy is an airway emergency from hematoma or laryngeal edema. Perioral numbness or Chvostek sign suggests hypocalcemia from parathyroid injury. Both need immediate intervention." },
        { question: "What's the difference between SIADH and DI?", answer: "SIADH = too much ADH, retains water, dilutional hyponatremia, concentrated urine. Treat with fluid restriction. DI = too little ADH, dumps water, hypernatremia, dilute urine. Treat with desmopressin and free water." },
        { question: "How do I treat hypoglycemia in an unconscious patient?", answer: "IM glucagon 1 mg if no IV access, IV dextrose D50 (25 g) if IV access. Recheck glucose in 15 min. Once awake, give complex carb + protein to prevent rebound." },
      ]}
      relatedSlugs={[
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-cardiac-questions", label: "Free NCLEX cardiac questions" },
        { slug: "nclex-lab-values-questions", label: "Free NCLEX lab values questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
