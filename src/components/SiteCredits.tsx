import { captureFor } from "../data/captures";
import type { PageId } from "../data/types";
import { capturedOn } from "../lib/capturedOn";

type SiteCreditsProps = { pages: readonly PageId[] };

const VERSIONS = ["before", "after"] as const;
const DEVICES = ["desktop", "mobile"] as const;

export function SiteCredits({ pages }: SiteCreditsProps) {
  const captured = capturedOn(
    pages.flatMap((page) =>
      VERSIONS.flatMap((version) =>
        DEVICES.map((device) => captureFor(page, version, device).capturedAt),
      ),
    ),
  );
  return (
    <footer className="mx-auto w-full max-w-[1240px] border-line border-t px-6 py-10 text-mist/50 text-sm">
      <p>
        Screens captured {captured} from production builds of each version. Frutiger is licensed to
        the NHS, so it appears here only as an image.
      </p>
    </footer>
  );
}
