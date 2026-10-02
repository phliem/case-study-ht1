import { useEffect, useId } from "react";
import { A_YEAR_ON } from "../data/caseStudy";
import { VIEWS } from "../data/views";
import type { UrlOptions } from "../lib/urlOptions";
import { ComparisonStage } from "./ComparisonStage";
import { SiteCredits } from "./SiteCredits";
import { YearHeader } from "./YearHeader";

type YearOnViewProps = { options: UrlOptions };

const [PAGE] = VIEWS["a-year-on"];

export function YearOnView({ options }: YearOnViewProps) {
  const headingId = useId();
  useEffect(() => {
    document.title = A_YEAR_ON.documentTitle;
  }, []);
  return (
    <>
      <YearHeader headingId={headingId} />
      <main className="pb-24">
        <ComparisonStage page={PAGE} options={options} eager labelledBy={headingId} />
      </main>
      <SiteCredits pages={VIEWS["a-year-on"]} />
    </>
  );
}
