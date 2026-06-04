"use client";

import { useEffect, useState } from "react";

type Recommendation = {
  id: string;
  genericName: string;
  drugClass: string;
};

type Props = {
  category: string | null;
  tags: string[] | null;
  rationale: string | null;
};

// Surfaces a small "Brush up" pill inside the rationale block when:
// - The question has a category or tags AND
// - The recommendation API returns a card AND
// - (heuristic) The rationale text mentions the drug's generic name or class.
export default function RationaleDrugCardTeaser({ category, tags, rationale }: Props) {
  const [rec, setRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRec(null);
    if (!category && (!tags || tags.length === 0)) return;
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (tags && tags.length > 0) params.set("tags", tags.join(","));
    fetch(`/api/drug-cards/recommend?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.data) return;
        const card = payload.data as Recommendation & { mechanism?: string | null };
        if (!card?.id || !card?.genericName || !card?.drugClass) return;
        // Heuristic: only surface if the rationale text plausibly mentions
        // the drug (substring of generic name) or the broader class. Avoids
        // randomly suggesting unrelated cards.
        if (rationale) {
          const haystack = rationale.toLowerCase();
          const firstToken = card.genericName.toLowerCase().split(/[\s(-]/)[0];
          const classToken = card.drugClass.toLowerCase().split(/[\s-]/)[0];
          if (firstToken && haystack.includes(firstToken)) {
            setRec(card);
            return;
          }
          if (classToken && haystack.includes(classToken)) {
            setRec(card);
            return;
          }
          // No textual match — don't render to avoid noise.
          return;
        }
        setRec(card);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [category, tags, rationale]);

  if (!rec) return null;

  return (
    <a
      href={`/drug-cards/${encodeURIComponent(rec.id)}`}
      className="rationale-drug-teaser"
      title={`Drug card: ${rec.genericName} (${rec.drugClass})`}
    >
      <span aria-hidden="true" className="rationale-drug-teaser__icon">📖</span>
      <span className="rationale-drug-teaser__copy">
        <strong>Brush up: {rec.genericName}</strong>
        <span>{rec.drugClass}</span>
      </span>
      <span className="rationale-drug-teaser__cta">Open →</span>
    </a>
  );
}
