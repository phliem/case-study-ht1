import { A_YEAR_ON, CASE_STUDY } from "../data/caseStudy";
import { LiveLink } from "./LiveLink";
import { MetaItem } from "./MetaItem";
import { PageHeader } from "./PageHeader";
import { ViewLink } from "./ViewLink";

export function CaseHeader() {
  return (
    <PageHeader
      title={CASE_STUDY.title}
      lede={CASE_STUDY.lede}
      next={
        <ViewLink view="a-year-on" direction="forward">
          {A_YEAR_ON.link}
        </ViewLink>
      }
    >
      <MetaItem term="Role">{CASE_STUDY.role}</MetaItem>
      <MetaItem term="Shipped">{CASE_STUDY.shipped}</MetaItem>
      <MetaItem term="Stack">
        <ul className="flex flex-wrap gap-2">
          {CASE_STUDY.stack.map((item) => (
            <li key={item} className="rounded-full border border-line px-3 py-1">
              {item}
            </li>
          ))}
        </ul>
      </MetaItem>
      <MetaItem term="Live">
        <LiveLink />
      </MetaItem>
    </PageHeader>
  );
}
