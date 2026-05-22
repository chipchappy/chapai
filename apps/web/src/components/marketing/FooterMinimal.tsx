import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import styles from "./FooterMinimal.module.css";

export default function FooterMinimal() {
  return (
    <footer className={styles.footer} data-premium-chrome="true">
      <div className={styles.inner}>
        <div>
          <BrandMark />
          <p className={styles.copy}>
            Premium NCLEX and CCRN prep with original nursing questions, realistic NGN practice, and a quieter study system.
          </p>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <Link href="/nclex">NCLEX</Link>
          <Link href="/ccrn">CCRN</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/quiz">Practice</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/account/billing">Billing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p className={styles.fine}>Chapai Solutions LLC. Clarity Clinical Prep.</p>
      </div>
    </footer>
  );
}
