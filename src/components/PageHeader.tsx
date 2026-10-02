import { m } from "motion/react";
import type { ReactNode } from "react";
import { CASE_STUDY } from "../data/caseStudy";
import { useMotionPreference } from "../hooks/useMotionPreference";

type PageHeaderProps = {
  title: string;
  lede: string;
  headingId?: string;
  back?: ReactNode;
  next?: ReactNode;
  children: ReactNode;
};

const RISE = [0.16, 1, 0.3, 1] as const;

export function PageHeader({ title, lede, headingId, back, next, children }: PageHeaderProps) {
  const { reduced } = useMotionPreference();
  const words = title.split(" ");
  return (
    <header className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-14 sm:pt-28">
      {back && <p className="mb-8 text-sm">{back}</p>}
      <p className="caption text-mint">{CASE_STUDY.eyebrow}</p>
      <h1
        id={headingId}
        className="mt-5 max-w-[12ch] text-balance font-extrabold text-[clamp(44px,8.4vw,112px)] leading-[0.95] tracking-[-0.035em]"
      >
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
        {lede}
      </m.p>
      <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 text-sm">{children}</dl>
      {next && <p className="mt-10 text-sm">{next}</p>}
    </header>
  );
}
