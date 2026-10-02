import { useInView } from "motion/react";
import { lazy, Suspense, useRef } from "react";

const DesignDiff = lazy(() =>
  import("./DesignDiff").then((module) => ({ default: module.DesignDiff })),
);

export function DeferredDesignDiff() {
  const placeholder = useRef<HTMLDivElement>(null);
  const near = useInView(placeholder, { once: true, margin: "100% 0px" });
  return (
    <div ref={placeholder} data-testid="design-diff" className="min-h-[50vh]">
      {near && (
        <Suspense fallback={null}>
          <DesignDiff />
        </Suspense>
      )}
    </div>
  );
}
