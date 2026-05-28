"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchDrugCards, type DrugCard } from "@/lib/drug-cards";

function DrugCardPreview({ card }: { card: DrugCard }) {
  return (
    <article className="study-console-panel bg-white/75">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="terminal-label">{card.class}</p>
          <h2 className="mt-2 font-serif text-[1.55rem] leading-tight text-dark">{card.genericName}</h2>
          {card.brandNames.length ? <p className="mt-1 text-sm text-muted">{card.brandNames.join(", ")}</p> : null}
        </div>
        {card.nclexHighYield ? <span className="signal-pill signal-pill-gold">High yield</span> : null}
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{card.mechanism}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {card.priorityLabs.slice(0, 3).map((lab) => (
          <span key={lab} className="signal-pill">{lab}</span>
        ))}
      </div>
      <Link href={`/study/pharmacology/${card.id}`} className="btn-secondary mt-5 inline-flex">
        Open card
      </Link>
    </article>
  );
}

export default function PharmacologyCardsClient() {
  const [query, setQuery] = useState("");
  const cards = useMemo(() => searchDrugCards(query), [query]);

  return (
    <div className="space-y-6">
      <section className="dashboard-hub rounded-[30px] p-6">
        <p className="terminal-label">Pharmacology library</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <div>
            <h1 className="font-serif text-[2.8rem] leading-[0.95] text-dark">High-yield drug cards for NCLEX remediation.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Search by generic name, brand name, class, lab, contraindication, or nursing assessment. These cards are designed to connect weak-area analytics to focused review.
            </p>
          </div>
          <div className="study-console-panel bg-white/70">
            <label className="terminal-label" htmlFor="drug-search">Search cards</label>
            <input
              id="drug-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="heparin, potassium, beta blocker..."
              className="mt-3 w-full rounded-[16px] border border-[rgba(74,85,89,0.14)] bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-[#b08d57]"
            />
            <p className="mt-3 text-sm leading-6 text-muted">{cards.length} of {searchDrugCards("").length} cards shown.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <DrugCardPreview key={card.id} card={card} />)}
      </section>
    </div>
  );
}
