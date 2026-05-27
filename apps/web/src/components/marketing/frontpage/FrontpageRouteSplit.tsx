import Link from "next/link";

const routes = [
  {
    eyebrow: "nclex route",
    title: "priority, safety, ngn, delegation",
    body: "Open the reviewed NCLEX qbank, stay in one testing deck, and move straight into rationale, diagram cues, and tutor-backed review.",
    href: "/nclex",
    cta: "open nclex",
  },
  {
    eyebrow: "ccrn route",
    title: "hemodynamics, vents, shock, case flow",
    body: "Use the same premium shell for ICU chart review, timed sims, and bedside-style debrief across the live CCRN bank.",
    href: "/ccrn",
    cta: "open ccrn",
  },
];

export default function FrontpageRouteSplit() {
  return (
    <section className="px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="frontpage-route-split-head">
          <div>
            <p className="section-label">choose the route</p>
            <h2 className="frontpage-route-split-title">start on the track you need, keep the same premium workflow.</h2>
          </div>
          <p className="frontpage-route-split-copy">
            Clarity keeps the surface consistent. Whether the student needs NCLEX priority logic or CCRN bedside signals, the question,
            chart review, rationale, and tutor all stay in the same controlled testing environment.
          </p>
        </div>

        <div className="frontpage-route-split-grid">
          {routes.map((route) => (
            <article key={route.eyebrow} className="frontpage-route-card">
              <p className="frontpage-route-eyebrow">{route.eyebrow}</p>
              <h3 className="frontpage-route-title">{route.title}</h3>
              <p className="frontpage-route-body">{route.body}</p>
              <Link href={route.href} className="frontpage-route-link">
                {route.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
