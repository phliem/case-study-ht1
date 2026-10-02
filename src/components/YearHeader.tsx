import { A_YEAR_ON, CASE_STUDY } from "../data/caseStudy";
import { LiveLink } from "./LiveLink";
import { MetaItem } from "./MetaItem";
import { PageHeader } from "./PageHeader";
import { ViewLink } from "./ViewLink";

type YearHeaderProps = { headingId: string };

export function YearHeader({ headingId }: YearHeaderProps) {
  return (
    <PageHeader
      title={A_YEAR_ON.title}
      lede={A_YEAR_ON.lede}
      headingId={headingId}
      back={
        <ViewLink view="main" direction="back">
          {CASE_STUDY.title}
        </ViewLink>
      }
    >
      <MetaItem term="Before">{A_YEAR_ON.before}</MetaItem>
      <MetaItem term="After">{A_YEAR_ON.after}</MetaItem>
      <MetaItem term="Live">
        <LiveLink />
      </MetaItem>
    </PageHeader>
  );
}
