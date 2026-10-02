import { isPageId } from "../data/pages";
import type { PageId } from "../data/types";
import { isViewId, VIEWS, type ViewId } from "../data/views";

export type RecordAspect = "16x9" | "4x3";

export type UrlOptions = {
  record: RecordAspect | null;
  tour: "full" | "short";
  page: PageId;
  view: ViewId;
};

export function parseUrlOptions(search: string): UrlOptions {
  const params = new URLSearchParams(search);
  const record = params.get("record");
  const page = params.get("page");
  const asked = params.get("view");
  const view: ViewId = isViewId(asked) ? asked : "main";
  return {
    record: record === "16x9" || record === "4x3" ? record : null,
    tour: params.get("tour") === "short" ? "short" : "full",
    page: isPageId(page) ? page : VIEWS[view][0],
    view,
  };
}
