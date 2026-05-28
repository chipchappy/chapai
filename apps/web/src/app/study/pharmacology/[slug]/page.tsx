import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DRUG_CARDS, getDrugCardById } from "@/lib/drug-cards";
import { getAuthenticatedUser } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getDrugCardById(slug);
  return {
    title: card ? `${card.genericName} Drug Card` : "Drug Card",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function generateStaticParams() {
  return DRUG_CARDS.map((card) => ({ slug: card.id }));
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="study-console-panel bg-white/75">
      <p className="terminal-label">{title}</p>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-muted">
        {items.map((item) => <li key={item} className="ml-4 list-disc">{item}</li>)}
      </ul>
    </section>
  );
}

export default async function DrugCardPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  const { slug } = await params;

  if (!user) {
    redirect(`/auth/login?next=/study/pharmacology/${encodeURIComponent(slug)}`);
  }

  const card = getDrugCardById(slug);
  if (!card) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link href="/study/pharmacology" className="text-sm font-semibold text-[#5A7F88] hover:text-dark">
          Back to pharmacology
        </Link>
        <section className="dashboard-hub rounded-[30px] p-6">
          <p className="terminal-label">{card.class}</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-[3rem] leading-[0.94] text-dark">{card.genericName}</h1>
              {card.brandNames.length ? <p className="mt-2 text-sm text-muted">{card.brandNames.join(", ")}</p> : null}
            </div>
            {card.nclexHighYield ? <span className="signal-pill signal-pill-gold">NCLEX high yield</span> : null}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">{card.mechanism}</p>
          {card.blackBoxWarning ? (
            <div className="mt-5 rounded-[18px] border border-[rgba(144,72,52,0.2)] bg-[rgba(144,72,52,0.08)] px-4 py-3 text-sm leading-6 text-[#7b4332]">
              <strong>Boxed warning focus:</strong> {card.blackBoxWarning}
            </div>
          ) : null}
        </section>
        <div className="grid gap-4 lg:grid-cols-3">
          <ListBlock title="Priority labs" items={card.priorityLabs} />
          <ListBlock title="Nursing assessments" items={card.nursingAssessments} />
          <ListBlock title="Contraindications" items={card.contraindications} />
        </div>
      </div>
    </main>
  );
}
