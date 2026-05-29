import CtaButtons from "./CtaButtons";
import styles from "./HeroCTA.module.css";
import { CcrnAnatomyArt, HomeAnatomyArt, NclexAnatomyArt } from "./heroAnatomy";
import type { HeroAnatomyArtKey } from "./marketingArtwork";

type HeroCTAProps = {
  heroArt?: HeroAnatomyArtKey;
};

function renderHeroArt(heroArt: HeroAnatomyArtKey) {
  const className = "premium-hero-anatomy-svg";

  if (heroArt === "nclex") {
    return <NclexAnatomyArt className={className} />;
  }

  if (heroArt === "ccrn") {
    return <CcrnAnatomyArt className={className} />;
  }

  return <HomeAnatomyArt className={className} />;
}

export default function HeroCTA({ heroArt = "home" }: HeroCTAProps) {
  return (
    <section className={styles.hero} data-art={heroArt}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>NCLEX-RN · From $9.99/mo</span>
          <h1 className={styles.title}>Stop overpaying for NCLEX prep.</h1>
          <p className={styles.subhead}>
            Premium NGN bank, AI tutor, and 5 readiness exams — for the price of a single coffee per week. Less than 10% of what UWorld charges, with the same rigor.
          </p>
          <div className={styles.actions}>
            <CtaButtons />
          </div>
          <p className={styles.quote}>
            UWorld $139/mo. Archer $79/mo. Kaplan $80. <strong>Clarity $9.99/mo.</strong>
          </p>
          <p className={styles.microcopy}>
            <span>&#10003; No credit card</span>
            <span>&#10003; 10 free questions every day</span>
            <span>&#10003; Cancel anytime</span>
          </p>
        </div>
        <div className={styles.figure} aria-hidden="true">
          <div className={styles.artFigure}>{renderHeroArt(heroArt)}</div>
        </div>
      </div>
    </section>
  );
}
