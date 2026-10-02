import { CAPTURES } from "../data/captures";
import { capturedOn } from "../lib/capturedOn";

const CAPTURED = capturedOn(CAPTURES.captures.map((capture) => capture.capturedAt));

export function SiteCredits() {
  return (
    <footer className="mx-auto w-full max-w-[1240px] border-line border-t px-6 py-10 text-mist/50 text-sm">
      <p>
        Screens captured {CAPTURED} from production builds of each version. Frutiger is licensed to
        the NHS, so it appears here only as an image.
      </p>
    </footer>
  );
}
