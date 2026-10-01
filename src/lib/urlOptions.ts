export type RecordAspect = "16x9" | "4x3";

export type UrlOptions = { record: RecordAspect | null; tour: "full" | "short" };

export function parseUrlOptions(search: string): UrlOptions {
  const params = new URLSearchParams(search);
  const record = params.get("record");
  return {
    record: record === "16x9" || record === "4x3" ? record : null,
    tour: params.get("tour") === "short" ? "short" : "full",
  };
}
