import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { CaseHeader } from "./components/CaseHeader";
import { ComparisonStage } from "./components/ComparisonStage";
import { DesignDiff } from "./components/DesignDiff";
import { GlowBackground } from "./components/GlowBackground";
import { SiteCredits } from "./components/SiteCredits";
import { PAGE_IDS } from "./data/pages";
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
                {PAGE_IDS.map((page, index) => (
                  <ComparisonStage key={page} page={page} options={options} eager={index === 0} />
                ))}
                <DesignDiff />
              </main>
              <SiteCredits />
            </>
          ) : (
            <ComparisonStage page={options.page} options={options} eager />
          )}
        </MotionPreferenceContext>
      </MotionConfig>
    </LazyMotion>
  );
}
