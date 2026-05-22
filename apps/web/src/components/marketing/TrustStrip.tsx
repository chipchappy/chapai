import styles from "./TrustStrip.module.css";

type TrustStripProps = {
  /** Live question count from the bank (e.g. getLiveBankStats().nclexLive). */
  questionCount?: number;
  /** Number of timed readiness exams. */
  examCount?: number;
};

function flooredCount(n?: number) {
  if (!n || n <= 0) return "2,300+";
  return `${(Math.floor(n / 100) * 100).toLocaleString()}+`;
}

export default function TrustStrip({ questionCount, examCount = 5 }: TrustStripProps) {
  const stats: Array<[string, string]> = [
    [flooredCount(questionCount), "Practice questions, mostly NGN"],
    [String(examCount), "Timed readiness exams"],
    ["Free", "Partial access — no credit card"],
    ["$9.99", "/mo for the full bank"],
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
