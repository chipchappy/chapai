import styles from "./TrustStrip.module.css";

const stats = [
  ["2,300+", "Premium NGN items"],
  ["60%", "Next-Gen case format"],
  ["$9.99", "Full bank, flat pricing"],
] as const;

export default function TrustStrip() {
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
