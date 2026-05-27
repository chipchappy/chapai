import { FrontpageSignalRings } from "./frontpage";
import type { FrontpageTone } from "./frontpage/frontpage-types";

type SplitImageHeroProps = {
  backgroundColor: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  eyebrow?: string;
  titleClassName?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  supportLine?: string;
  tone?: FrontpageTone;
};

export default function SplitImageHero({
  backgroundColor,
  title,
  body,
  buttonLabel,
  buttonHref,
  eyebrow = "Clarity Clinical Prep",
  titleClassName = "",
  secondaryLabel,
  secondaryHref,
  supportLine = "Original questions, clearer rationale, and a cleaner study flow.",
  tone = "warm",
}: SplitImageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[rgba(74,85,89,0.08)]" style={{ backgroundColor }}>
      <div className="pointer-events-none absolute left-[-1rem] top-12 select-none text-[14rem] font-serif leading-none tracking-[-0.08em] text-[rgba(38,38,44,0.04)] md:left-[1rem] md:text-[18rem]">
        C
      </div>

      <div className="mx-auto grid min-h-[66vh] max-w-[1180px] items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[minmax(0,38rem)_minmax(18rem,1fr)] lg:px-14 lg:py-16">
        <div className="max-w-[36rem]">
          <div className="flex max-w-[36rem] flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6A6D73]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#7E9D86]" />
            <span className="font-sans font-medium">{eyebrow}</span>
            <span className="hidden h-px w-10 bg-[rgba(126,157,134,0.24)] md:inline-flex" />
            <span className="font-sans text-sm text-[#777B80]">{supportLine}</span>
          </div>
          <h1
            className={`mt-6 font-serif text-[clamp(3.8rem,8vw,6.5rem)] leading-[0.9] tracking-[-0.07em] text-[#1E2328] ${titleClassName}`.trim()}
          >
            {title}
          </h1>
          <p className="mt-7 max-w-[30rem] font-sans text-[1.05rem] leading-8 text-[#5A5F63]">{body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={buttonHref}
              className="inline-flex items-center justify-center rounded-[14px] bg-[#7E9D86] px-6 py-3.5 font-sans text-sm font-semibold text-white transition duration-200 hover:bg-[#6F8D76]"
            >
              {buttonLabel}
            </a>
            {secondaryLabel && secondaryHref ? (
              <a
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-[14px] border border-[rgba(74,85,89,0.12)] bg-[rgba(255,255,255,0.4)] px-6 py-3.5 font-sans text-sm font-semibold text-[#2C3338] transition duration-200 hover:border-[rgba(74,85,89,0.24)] hover:bg-[rgba(255,255,255,0.7)]"
              >
                {secondaryLabel}
              </a>
            ) : null}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px w-20 bg-[rgba(98,105,108,0.22)]" />
            <p className="font-sans text-sm text-[#7A7067]">{supportLine}</p>
          </div>
        </div>

        <div className="flex min-h-[20rem] items-center justify-center lg:min-h-[32rem] lg:justify-end">
          <FrontpageSignalRings tone={tone} className="max-w-[28rem] opacity-90 md:max-w-[34rem]" />
        </div>
      </div>
    </section>
  );
}
