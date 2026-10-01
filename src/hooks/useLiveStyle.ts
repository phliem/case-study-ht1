import { type MotionValue, useMotionValueEvent } from "motion/react";
import { type CSSProperties, type RefObject, useRef } from "react";

type LiveProperty = "transform" | "left" | "opacity";

export type LiveStyle<T extends HTMLElement> = { ref: RefObject<T | null>; style: CSSProperties };

// Written straight to the element rather than through an m component's style: Motion's lazily
// loaded features drop any value set before they arrive, which left the pages misaligned.
export function useLiveStyle<T extends HTMLElement>(
  value: MotionValue<number>,
  property: LiveProperty,
  format: (latest: number) => string,
): LiveStyle<T> {
  const ref = useRef<T>(null);
  useMotionValueEvent(value, "change", (latest) => {
    ref.current?.style.setProperty(property, format(latest));
  });
  return { ref, style: { [property]: format(value.get()) } };
}
