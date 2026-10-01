import { m, useInView } from "motion/react";
import { useRef } from "react";
import { CASE_STUDY } from "../data/caseStudy";
import { TIMELINE } from "../data/timeline";
import { useMotionPreference } from "../hooks/useMotionPreference";

const DRAW = [0.65, 0, 0.35, 1] as const;

export function ShipTimeline() {
  const track = useRef<HTMLDivElement>(null);
  const inView = useInView(track, { once: true, amount: 0.4 });
  const { reduced } = useMotionPreference();
  const shown = reduced || inView;
  return (
    <section
      aria-labelledby="timeline-heading"
      className="mx-auto w-full max-w-[1240px] px-6 pt-32 pb-8"
    >
      <p className="caption text-mint">How it shipped</p>
      <h2
        id="timeline-heading"
        className="mt-3 font-extrabold text-4xl tracking-[-0.03em] sm:text-5xl"
      >
        Four chunks, one week
      </h2>
      <div ref={track} className="relative mt-14">
        <m.span
          aria-hidden="true"
          className="absolute top-[7px] left-0 hidden h-px w-full origin-left bg-linear-to-r from-mint via-mint/60 to-transparent sm:block"
          initial={reduced ? false : { scaleX: 0 }}
          animate={shown ? { scaleX: 1 } : undefined}
          transition={{ duration: 1.2, ease: DRAW }}
        />
        <m.span
          aria-hidden="true"
          className="absolute top-0 left-[7px] h-full w-px origin-top bg-linear-to-b from-mint via-mint/60 to-transparent sm:hidden"
          initial={reduced ? false : { scaleY: 0 }}
          animate={shown ? { scaleY: 1 } : undefined}
          transition={{ duration: 1.2, ease: DRAW }}
        />
        <ol className="grid gap-10 sm:grid-cols-4 sm:gap-6">
          {TIMELINE.map((chunk, index) => (
            <m.li
              key={chunk.title}
              className="relative pl-8 sm:pt-8 sm:pl-0"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={shown ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.25 + index * 0.15, duration: 0.5 }}
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 size-[15px] rounded-full border-2 border-mint bg-ink"
              />
              <p className="caption text-mist/55">{chunk.date}</p>
              <h3 className="mt-2 font-extrabold text-xl">{chunk.title}</h3>
              <p className="mt-2 text-mist/70 text-sm leading-relaxed">{chunk.detail}</p>
            </m.li>
          ))}
        </ol>
      </div>
      <a
        href={CASE_STUDY.liveUrl}
        className="mt-14 inline-flex items-center gap-2 font-extrabold text-lg text-mint hover:underline"
      >
        Live at bookable.health <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
