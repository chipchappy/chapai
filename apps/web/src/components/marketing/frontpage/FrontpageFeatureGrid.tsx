import Link from "next/link";
import type { FrontpageFeatureGridProps, FrontpageTone } from "./frontpage-types";

const toneStyles: Record<
  FrontpageTone,
  {
    label: string;
    title: string;
    body: string;
    card: string;
    cardTitle: string;
    cardBody: string;
    link: string;
  }
> = {
  warm: {
    label: "text-[#6c6a66]",
    title: "text-[#1E2328]",
    body: "text-[#5a5b59]",
    card: "border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)]",
    cardTitle: "text-[#1F252A]",
    cardBody: "text-[#575d61]",
    link: "text-[#232a2d]",
  },
  cool: {
    label: "text-[#6c6a66]",
    title: "text-[#1E2328]",
    body: "text-[#5a5b59]",
    card: "border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)]",
    cardTitle: "text-[#1F252A]",
    cardBody: "text-[#575d61]",
    link: "text-[#232a2d]",
  },
  sage: {
    label: "text-[#6c6a66]",
    title: "text-[#1E2328]",
    body: "text-[#5a5b59]",
    card: "border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)]",
    cardTitle: "text-[#1F252A]",
    cardBody: "text-[#575d61]",
    link: "text-[#232a2d]",
  },
};

export default function FrontpageFeatureGrid({
  label,
  title,
  body,
  cards,
  tone = "warm",
  className = "",
}: FrontpageFeatureGridProps) {
  const styles = toneStyles[tone];

  return (
    <section className={className.trim()}>
      <div className="mx-auto grid max-w-[1180px] gap-10 border-t border-[rgba(74,85,89,0.08)] pt-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="max-w-[28rem]">
          <span className={`font-sans text-[11px] font-semibold uppercase tracking-[0.28em] ${styles.label}`}>
            {label}
          </span>
          <h2 className={`mt-4 text-[clamp(2.35rem,4.2vw,4rem)] leading-[0.96] tracking-[-0.05em] ${styles.title}`}>
            {title}
          </h2>
          <p className={`mt-5 font-sans text-[1.04rem] leading-8 ${styles.body}`}>{body}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`h-full rounded-[20px] border p-6 md:p-7 ${styles.card}`.trim()}
            >
              <span className={`font-sans text-[11px] font-semibold uppercase tracking-[0.24em] ${styles.label}`}>
                {card.eyebrow}
              </span>
              <h3 className={`mt-4 text-[1.55rem] leading-tight tracking-[-0.03em] ${styles.cardTitle}`}>
                {card.title}
              </h3>
              <p className={`mt-4 font-sans text-sm leading-7 ${styles.cardBody}`}>{card.body}</p>
              <Link href={card.href} className={`mt-6 inline-flex font-sans text-sm font-semibold ${styles.link}`}>
                {card.hrefLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
