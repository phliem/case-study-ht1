import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { CaseHeader } from "./components/CaseHeader";
import { ComparisonStage } from "./components/ComparisonStage";
import { DesignDiff } from "./components/DesignDiff";
import { GlowBackground } from "./components/GlowBackground";
import { MotionPreferenceContext } from "./hooks/useMotionPreference";
import { parseUrlOptions } from "./lib/urlOptions";

const loadFeatures = () => import("./motionFeatures").then((module) => module.default);

export function App() {
  const options = useMemo(() => parseUrlOptions(window.location.search), []);
  const systemReduced = useReducedMotion() ?? false;
  const preference = useMemo(
    () => ({ reduced: systemReduced && options.record === null }),
    [systemReduced, options.record],
  );
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={options.record === null ? "user" : "never"}>
        <MotionPreferenceContext value={preference}>
          {options.record === null ? (
            <>
              <GlowBackground />
              <CaseHeader />
              <main className="pb-24">
                <ComparisonStage options={options} />
                <DesignDiff />
              </main>
            </>
          ) : (
            <ComparisonStage options={options} />
          )}
        </MotionPreferenceContext>
      </MotionConfig>
    </LazyMotion>
  );
}
