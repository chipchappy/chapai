import styles from "./TrustStrip.module.css";

type TrustStripProps = {
  /** Live question count from the bank (e.g. getLiveBankStats().nclexLive). */
  questionCount?: number;
  /** Number of timed readiness exams. */
  examCount?: number;
  /** NGN-specific live count from the bank. Drives the first stat so the
   *  strip doesn't repeat the total shown again in HighlightsBand below. */
  ngnCount?: number;
};

function flooredCount(n?: number) {
  if (!n || n <= 0) return "5,000+";
  return `${(Math.floor(n / 100) * 100).toLocaleString()}+`;
}

export default function TrustStrip({ questionCount, examCount = 5, ngnCount }: TrustStripProps) {
  const ngnDisplay = flooredCount(ngnCount ?? Math.round((questionCount ?? 0) * 0.35));
  const stats: Array<[string, string]> = [
    [ngnDisplay, "NGN-style items (case, bow-tie, matrix)"],
    [String(examCount), "Timed readiness exams"],
    ["Free", "Study account, no credit card"],
    ["$9.99/month", "Full access"],
  ];

  return (
    <section className={styles.strip} aria-label="Clarity NCLEX proof points">
      <div className={styles.inner}>
        {stats.map(([value, label]) => (
          <div className={styles.stat} key={label}>
            <span className={styles.value}>{value}</span>
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
