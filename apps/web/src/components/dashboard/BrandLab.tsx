const OPTIONS = [
  { key: "Option 1", file: "/brand/options/chapai-option-1.svg", note: "Open clinical ring with bedside pulse." },
  { key: "Option 2", file: "/brand/options/chapai-option-2.svg", note: "Cleaner plus-mark inside an open C. Strongest system-logo fit." },
  { key: "Option 3", file: "/brand/options/chapai-option-3.svg", note: "Wordmark-forward monogram. Feels more editorial." },
  { key: "Option 4", file: "/brand/options/chapai-option-4.svg", note: "Device-window look with chart signal. More app-like." },
  { key: "Option 5", file: "/brand/options/chapai-option-5.svg", note: "Signal halo with a stronger premium-medical mood." },
  { key: "Option 6", file: "/brand/options/chapai-option-6.svg", note: "Thinner live-mark evolution. Most faithful to the current direction." },
  { key: "Option 7", file: "/brand/options/chapai-option-7.svg", note: "Open arc + downward caret. Feels more luxe and directional." },
  { key: "Option 8", file: "/brand/options/chapai-option-8.svg", note: "Editorial monoline medical cross, built to stay slim." },
  { key: "Option 9", file: "/brand/options/chapai-option-9.svg", note: "Heartbeat inside the ring. Most exam-product coded." },
  { key: "Option 10", file: "/brand/options/chapai-option-10.svg", note: "Clean orbital cross. Strongest for social avatars and app chrome." },
  { key: "Option 11", file: "/brand/options/chapai-option-11.svg", note: "Super-thin orbital mark with the calmest editorial feel." },
  { key: "Option 12", file: "/brand/options/chapai-option-12.svg", note: "Most anatomical-feeling monoline mark without becoming busy." },
  { key: "Option 13", file: "/brand/options/chapai-option-13.svg", note: "The sleekest system-logo option for app chrome and favicon use." },
  { key: "Option 14", file: "/brand/options/chapai-option-14.svg", note: "Feels the most luxury-medical and brandable for social." },
  { key: "Option 15", file: "/brand/options/chapai-option-15.svg", note: "Very fine editorial ring with the lightest medical signal." },
  { key: "Option 16", file: "/brand/options/chapai-option-16.svg", note: "Anatomical monoline branch mark with a calmer clinic feel." },
  { key: "Option 17", file: "/brand/options/chapai-option-17.svg", note: "The most pared-back symbol-first option for premium app chrome." },
  { key: "Option 18", file: "/brand/options/chapai-option-18.svg", note: "Thin luxury-medical mark with the strongest upscale mood." },
  { key: "Option 19", file: "/brand/options/chapai-option-19.svg", note: "Vitruvian-inspired orbit with the thinnest editorial line weight." },
  { key: "Option 20", file: "/brand/options/chapai-option-20.svg", note: "Lung-branch monoline mark for the cleanest anatomical read." },
  { key: "Option 21", file: "/brand/options/chapai-option-21.svg", note: "Brain-wave crest with a softer premium-app feel." },
  { key: "Option 22", file: "/brand/options/chapai-option-22.svg", note: "Heartline orbital mark designed for social and favicon use." },
  { key: "Option 23", file: "/brand/options/chapai-option-23.svg", note: "Anatomy orbit wordmark with a softer hand-drawn heart center." },
  { key: "Option 24", file: "/brand/options/chapai-option-24.svg", note: "Editorial heart-orbit mark with the slimmest clinic-luxury feel." },
  { key: "Option 25", file: "/brand/options/chapai-option-25.svg", note: "Human-axis anatomy orbit with a softer vitruvian editorial feel." },
  { key: "Option 26", file: "/brand/options/chapai-option-26.svg", note: "Thin lung-branch orbit for the cleanest respiratory/anatomy read." },
  { key: "Option 27", file: "/brand/options/chapai-option-27.svg", note: "Hand-drawn heart orbit with the warmest premium-medical mood." },
  { key: "Option 28", file: "/brand/options/chapai-option-28.svg", note: "Editorial anatomy crest with a calm clinic-luxury silhouette." },
  { key: "Option 29", file: "/brand/options/chapai-option-29.svg", note: "Open anatomy orbit with the cleanest premium-system posture." },
  { key: "Option 30", file: "/brand/options/chapai-option-30.svg", note: "Monoline heartbeat crest designed for creator-facing social avatars." },
  { key: "Option 31", file: "/brand/options/chapai-option-31.svg", note: "Tall orbit axis with the most Apple-meets-medical restraint." },
  { key: "Option 32", file: "/brand/options/chapai-option-32.svg", note: "Lung-branch editorial symbol with a softer luxury-medical read." },
  { key: "Option 33", file: "/brand/options/chapai-option-33.svg", note: "Human-figure orbit mark with the strongest anatomy-story direction." },
  { key: "Option 34", file: "/brand/options/chapai-option-34.svg", note: "Open anatomy aperture with the cleanest luxury-editorial posture." },
  { key: "Option 35", file: "/brand/options/chapai-option-35.svg", note: "Tall serif wordmark paired with a medical orbit spark." },
  { key: "Option 36", file: "/brand/options/chapai-option-36.svg", note: "Pulse-thread monogram built for app chrome and creator-facing use." },
  { key: "Option 37", file: "/brand/options/chapai-option-37.svg", note: "Anatomy plate crest with the warmest hand-drawn medical mood." },
  { key: "Option 38", file: "/brand/options/chapai-option-38.svg", note: "Minimal orbit symbol with the most premium system-brand feel." },
  { key: "Option 39", file: "/brand/options/chapai-option-39.svg", note: "Aperture orbit with a stronger premium-medical focal point." },
  { key: "Option 40", file: "/brand/options/chapai-option-40.svg", note: "Softer clinical crest with a more understated upscale feel." },
  { key: "Option 41", file: "/brand/options/chapai-option-41.svg", note: "Editorial wordmark route with the clearest premium-brand posture." },
  { key: "Option 42", file: "/brand/options/chapai-option-42.svg", note: "Lean orbit mark for app chrome, social icons, and mobile UI." },
  { key: "Option 43", file: "/brand/options/chapai-option-43.svg", note: "Muted plum-accent direction with a more elevated luxury tone." },
  { key: "Option 44", file: "/brand/options/chapai-option-44.svg", note: "Horizontal clinical wordmark with a clean startup-brand attitude." },
  { key: "Option 45", file: "/brand/options/chapai-option-45.svg", note: "Warm metallic crest with a more anatomical heartbeat cadence." },
  { key: "Option 46", file: "/brand/options/chapai-option-46.svg", note: "System-first monogram tuned for modern product chrome." },
  { key: "Option 47", file: "/brand/options/chapai-option-47.svg", note: "Serif-forward identity with a sharper editorial authority." },
  { key: "Option 48", file: "/brand/options/chapai-option-48.svg", note: "Sage-accent orbit for a calmer healthcare surface." },
  { key: "Option 49", file: "/brand/options/chapai-option-49.svg", note: "Minimal crest with a stronger premium-symbol direction." },
  { key: "Option 50", file: "/brand/options/chapai-option-50.svg", note: "Most complete premium wordmark route for outreach and creator decks." },
];

export default function BrandLab() {
  return (
    <section className="rounded-[30px] border border-border bg-[rgba(251,249,243,0.9)] p-5 shadow-card md:p-6">
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted">Private brand lab</div>
      <h2 className="mt-2 font-serif text-2xl leading-tight text-dark">{OPTIONS.length} cleaner logo directions to compare.</h2>
      <p className="mt-3 max-w-3xl text-sm text-muted">
        I switched the live site to a thinner mark and kept a larger private option set here so we can keep refining
        the identity without stalling the product surface.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {OPTIONS.map((option) => (
          <article key={option.key} className="rounded-[22px] border border-border bg-[rgba(255,252,247,0.9)] p-4">
            <div className="aspect-square rounded-[20px] border border-border bg-[linear-gradient(180deg,rgba(251,250,246,0.96),rgba(241,236,228,0.9))] p-4">
              <img src={option.file} alt={option.key} className="h-full w-full" />
            </div>
            <strong className="mt-4 block text-sm text-dark">{option.key}</strong>
            <p className="mt-2 text-sm text-muted">{option.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
