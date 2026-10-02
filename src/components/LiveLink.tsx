import { CASE_STUDY } from "../data/caseStudy";

export function LiveLink() {
  return (
    <a
      href={CASE_STUDY.liveUrl}
      className="underline decoration-mint underline-offset-4 hover:text-mint"
    >
      bookable.health
    </a>
  );
}
