import styles from "./layout.module.css";

export default function TestRunnerLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.examScope} examScope`}>{children}</div>;
}
