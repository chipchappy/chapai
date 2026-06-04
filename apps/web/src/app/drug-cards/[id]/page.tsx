import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getDrugCardById } from "@/lib/drug-cards";
import BookmarkButton from "./BookmarkButton";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const env = resolveEnv();
  if (!hasDatabase(env)) return { title: "Drug card | Clarity" };
  const card = await getDrugCardById(getDB(env), id);
  if (!card) return { title: "Drug card not found | Clarity", robots: { index: false } };
  return {
    title: `${card.genericName} — ${card.drugClass} | Clarity NCLEX`,
    description: card.mechanism ?? `Quick NCLEX drug card for ${card.genericName} (${card.drugClass}).`,
    alternates: { canonical: `/drug-cards/${id}` },
    openGraph: {
      title: `${card.genericName} drug card`,
      description: card.mechanism ?? card.drugClass,
      type: "article",
    },
  };
}

type FieldProps = {
  label: string;
  value: string | null;
  tone?: "default" | "warning";
};

function Field({ label, value, tone = "default" }: FieldProps) {
  if (!value) return null;
  return (
    <section className={`drug-card__field ${tone === "warning" ? "drug-card__field--warning" : ""}`}>
      <h3 className="drug-card__label">{label}</h3>
      <p className="drug-card__value">{value}</p>
    </section>
  );
}

export default async function DrugCardPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const env = resolveEnv();
  if (!hasDatabase(env)) notFound();
  const card = await getDrugCardById(getDB(env), id);
  if (!card) notFound();

  const tags = (card.relatedTags ?? "")
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);

  return (
    <main className="drug-card-main">
      <article className="drug-card">
        <header className="drug-card__head">
          <span className="drug-card__eyebrow">Drug card</span>
          <h1 className="drug-card__name">{card.genericName}</h1>
          {card.brandNames ? (
            <p className="drug-card__brands">Brand names: {card.brandNames}</p>
          ) : null}
          <p className="drug-card__class">
            <span className="drug-card__class-pill">{card.drugClass}</span>
          </p>
        </header>

        {card.blackBoxWarning ? (
          <aside className="drug-card__blackbox" role="note" aria-label="Black box warning">
            <strong>⚠ Black box warning</strong>
            <p>{card.blackBoxWarning}</p>
          </aside>
        ) : null}

        <div className="drug-card__grid">
          <Field label="Mechanism of action" value={card.mechanism} />
          <Field label="Priority labs to monitor" value={card.priorityLabs} />
          <Field label="Patient teaching" value={card.patientTeaching} />
          <Field label="Nursing implications" value={card.nursingImplications} />
        </div>

        {tags.length > 0 ? (
          <footer className="drug-card__tags">
            {tags.map((tag) => (
              <span key={tag} className="drug-card__tag">{tag.replace(/_/g, " ")}</span>
            ))}
          </footer>
        ) : null}

        <div className="drug-card__actions">
          <BookmarkButton id={id} />
          <Link href="/quiz" className="drug-card__cta">Back to practice →</Link>
          <Link href="/dashboard" className="drug-card__cta drug-card__cta--ghost">Dashboard</Link>
        </div>
      </article>
    </main>
  );
}
