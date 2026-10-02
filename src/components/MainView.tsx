import { VIEWS } from "../data/views";
import type { UrlOptions } from "../lib/urlOptions";
import { CaseHeader } from "./CaseHeader";
import { ComparisonStage } from "./ComparisonStage";
import { DeferredDesignDiff } from "./DeferredDesignDiff";
import { SiteCredits } from "./SiteCredits";

type MainViewProps = { options: UrlOptions };

export function MainView({ options }: MainViewProps) {
  return (
    <>
      <CaseHeader />
      <main className="pb-24">
        {VIEWS.main.map((page, index) => (
          <ComparisonStage key={page} page={page} options={options} eager={index === 0} />
        ))}
        <DeferredDesignDiff />
      </main>
      <SiteCredits pages={VIEWS.main} />
    </>
  );
}
