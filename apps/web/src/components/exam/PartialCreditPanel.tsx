import { BarChart3, CheckCircle2, Clock3, Scale } from "lucide-react";
import styles from "./PartialCreditPanel.module.css";

function formatShortTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function PartialCreditPanel({
  credit,
  maxPoints,
  avgPointsScored,
  scoringRule,
  timeSpentSeconds,
}: {
  credit: number;
  maxPoints: number;
  avgPointsScored: number;
  scoringRule: string;
  timeSpentSeconds: number;
}) {
  const rows = [
    { icon: CheckCircle2, label: "Credit", value: `${credit} / ${maxPoints}` },
    { icon: BarChart3, label: "Avg Points Scored", value: `${avgPointsScored.toFixed(2)} / ${maxPoints}` },
    { icon: Scale, label: "Scoring Rule", value: scoringRule },
    { icon: Clock3, label: "Time Spent", value: formatShortTime(timeSpentSeconds) },
  ];

  return (
    <div className={styles.panel} aria-label="Partial credit">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div className={styles.row} key={row.label}>
            <Icon className={styles.icon} size={17} aria-hidden="true" />
            <span className={styles.label}>{row.label}</span>
            <span className={styles.value}>{row.value}</span>
          </div>
        );
      })}
    </div>
  );
}
