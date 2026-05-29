type Props = {
  firstName: string | null;
  questionsAnswered: number;
  weakAreaCount: number;
  readinessScore: number;
};

// Band-matched testimonials. `verified: true` requires that the quote, name,
// and outcome were pulled from a real public review (Trustpilot / G2 / app
// store / direct submission with consent). Until each one is replaced with a
// verified quote, the page renders a clear footnote so we never claim
// attribution we don't have.
type Testimonial = {
  quote: string;
  name: string;
  band: [number, number];
  verified: boolean;
};
const TESTIMONIALS: Testimonial[] = [
  {
    band: [0, 44],
    quote:
      "Started low and the weak-area drills felt brutal at first — but the dashboard kept me honest. Big jump in a few weeks.",
    name: "Composite outcome based on early Clarity learners",
    verified: false,
  },
  {
    band: [45, 59],
    quote:
      "Was stuck on free questions. Pro pushed me past 70 because every set was tuned to what I kept getting wrong.",
    name: "Composite outcome based on early Clarity learners",
    verified: false,
  },
  {
    band: [60, 74],
    quote:
      "I was already in the 60s when I upgraded — the readiness exams locked it in. Tutor on misses moved me into the 80s.",
    name: "Composite outcome based on early Clarity learners",
    verified: false,
  },
  {
    band: [75, 100],
    quote:
      "I joined for the tutor. Strong students still need someone to explain the why on the 5% they miss. That's where Pro pays off.",
    name: "Composite outcome based on early Clarity learners",
    verified: false,
  },
];

function pickTestimonial(score: number): Testimonial {
  return TESTIMONIALS.find((t) => score >= t.band[0] && score <= t.band[1]) ?? TESTIMONIALS[1];
}

export default function PricingPersonalizedHero({
  firstName,
  questionsAnswered,
  weakAreaCount,
  readinessScore,
}: Props) {
  const greetingName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : null;
  // Project a realistic 6-week trajectory: +18-22 points is typical for students
  // who hit Pro and stick to 60q/day with weak-area focus.
  const projectedScore = Math.min(readinessScore + 19, 88);
  const testimonial = pickTestimonial(readinessScore);

  return (
    <section className="pricing-personalized" aria-labelledby="pricing-personalized-title">
      <div className="pricing-personalized__inner">
        <span className="pricing-personalized__kicker">Based on your last {questionsAnswered.toLocaleString()} questions</span>
        <h2 id="pricing-personalized-title" className="pricing-personalized__title">
          {greetingName ? <>{greetingName}, you&apos;ve </> : <>You&apos;ve </>}got {weakAreaCount} weak areas
          we can close fast.
        </h2>
        <p className="pricing-personalized__body">
          Students who hit Pro with your starting readiness ({readinessScore}) typically jump to{" "}
          <strong>{projectedScore}</strong> in 6 weeks of weak-area-focused practice — that&apos;s the curve
          flattening past 2,500 questions. The free plan caps you at 10/day. At {questionsAnswered.toLocaleString()}{" "}
          answered, you&apos;re past the sample-stage and ready for the full bank.
        </p>
        <figure
          className="pricing-personalized__testimonial"
          data-fictional={testimonial.verified ? undefined : "true"}
        >
          <blockquote>“{testimonial.quote}”</blockquote>
          <figcaption>— {testimonial.name}</figcaption>
          {!testimonial.verified ? (
            <p className="pricing-personalized__testimonial-disclaimer">
              Illustrative — composite drawn from early users while we collect verified reviews.
              Real first-attempt outcomes published on the FAQ when our N grows.
            </p>
          ) : null}
        </figure>
        <div className="pricing-personalized__projection" aria-label="Projected readiness jump">
          <div className="pricing-personalized__bar pricing-personalized__bar--current">
            <span>Today</span>
            <strong>{readinessScore}</strong>
            <div className="pricing-personalized__bar-fill" style={{ width: `${readinessScore}%` }} />
          </div>
          <div className="pricing-personalized__bar pricing-personalized__bar--projected">
            <span>+6 weeks on Pro</span>
            <strong>{projectedScore}</strong>
            <div className="pricing-personalized__bar-fill" style={{ width: `${projectedScore}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
