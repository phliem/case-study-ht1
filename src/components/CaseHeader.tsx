import { m } from "motion/react";
import { CASE_STUDY } from "../data/caseStudy";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { MetaItem } from "./MetaItem";

const RISE = [0.16, 1, 0.3, 1] as const;

export function CaseHeader() {
  const { reduced } = useMotionPreference();
  const words = CASE_STUDY.title.split(" ");
  return (
    <header className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-14 sm:pt-28">
      <p className="caption text-mint">{CASE_STUDY.eyebrow}</p>
      <h1 className="mt-5 max-w-[12ch] text-balance font-extrabold text-[clamp(44px,8.4vw,112px)] leading-[0.95] tracking-[-0.035em]">
        {words.map((word, index) => (
          <span key={word}>
            {index > 0 && " "}
            <m.span
              className="inline-block"
              initial={reduced ? false : { opacity: 0, y: "0.5em" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 * index, ease: RISE }}
            >
              {word}
            </m.span>
          </span>
        ))}
      </h1>
      <m.p
        className="mt-7 max-w-[620px] text-lg text-mist/75 sm:text-xl"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {CASE_STUDY.lede}
      </m.p>
      <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 text-sm">
        <MetaItem term="Stack">
          <ul className="flex flex-wrap gap-2">
            {CASE_STUDY.stack.map((item) => (
              <li key={item} className="rounded-full border border-line px-3 py-1">
                {item}
              </li>
            ))}
          </ul>
        </MetaItem>
        <MetaItem term="Live">
          <a
            href={CASE_STUDY.liveUrl}
            className="underline decoration-mint underline-offset-4 hover:text-mint"
          >
            bookable.health
          </a>
        </MetaItem>
      </dl>
    </header>
  );
}
