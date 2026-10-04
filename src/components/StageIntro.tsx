import { PAGES } from "../data/pages";
import type { PageId } from "../data/types";
import { MetaItem } from "./MetaItem";

type StageIntroProps = { page: PageId; headingId: string };

export function StageIntro({ page, headingId }: StageIntroProps) {
  const { number, name, summary, route } = PAGES[page];
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-10 sm:pt-28">
      <p className="caption text-mint">{number}</p>
      <h2 id={headingId} className="mt-3 font-extrabold text-4xl tracking-[-0.03em] sm:text-5xl">
        {name}
      </h2>
      <p className="mt-4 max-w-[620px] text-lg text-mist/70">{summary}</p>
      <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4 text-sm">
        <MetaItem term="Route">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 [overflow-wrap:anywhere]">
            {route.before !== route.after && (
              <>
                <code>{route.before}</code>
                <span aria-hidden="true">→</span>
                <span className="sr-only">became</span>
              </>
            )}
            <code>{route.after}</code>
          </span>
        </MetaItem>
      </dl>
    </div>
  );
}
