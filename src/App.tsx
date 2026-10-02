import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { ComparisonStage } from "./components/ComparisonStage";
import { GlowBackground } from "./components/GlowBackground";
import { MainView } from "./components/MainView";
import { YearOnView } from "./components/YearOnView";
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
              {options.view === "main" ? (
                <MainView options={options} />
              ) : (
                <YearOnView options={options} />
              )}
            </>
          ) : (
            <ComparisonStage page={options.page} options={options} eager />
          )}
        </MotionPreferenceContext>
      </MotionConfig>
    </LazyMotion>
  );
}
