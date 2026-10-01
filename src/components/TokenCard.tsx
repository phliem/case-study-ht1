import { useInView } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Version } from "../data/types";

type TokenCardProps = {
  title: string;
  beforeValue: string;
  afterValue: string;
  children: (state: Version) => ReactNode;
};

const SETTLE_MS = 450;

export function TokenCard({ title, beforeValue, afterValue, children }: TokenCardProps) {
  const card = useRef<HTMLButtonElement>(null);
  const inView = useInView(card, { once: true, amount: 0.6 });
  const [settled, setSettled] = useState(false);
  const [choice, setChoice] = useState<Version | null>(null);

  useEffect(() => {
    if (!inView) return;
    const id = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [inView]);

  const state: Version = choice ?? (settled ? "after" : "before");
  return (
    <button
      ref={card}
      type="button"
      aria-pressed={state === "after"}
      onClick={() => setChoice(state === "after" ? "before" : "after")}
      className="flex flex-col rounded-3xl border border-line bg-white/[0.03] p-5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2"
    >
      <span className="caption text-mist/60">{title}</span>
      <span className="mt-4 grid h-40 place-items-center overflow-hidden rounded-2xl bg-ink-2">
        {children(state)}
      </span>
      <span className="mt-4 grid grid-cols-2 gap-3 text-sm leading-snug">
        <span className={state === "before" ? "text-mist" : "text-mist/60"}>
          <span className="caption block text-slate">Before</span>
          <span className="block">{beforeValue}</span>
        </span>
        <span className={state === "after" ? "text-mist" : "text-mist/60"}>
          <span className="caption block text-mint">After</span>
          <span className="block">{afterValue}</span>
        </span>
      </span>
    </button>
  );
}
