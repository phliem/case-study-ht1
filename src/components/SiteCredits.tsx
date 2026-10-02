import { captureFor } from "../data/captures";

const CAPTURED_ON = new Date(captureFor("home", "after", "desktop").capturedAt).toLocaleDateString(
  "en-GB",
  {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
);

export function SiteCredits() {
  return (
    <footer className="mx-auto w-full max-w-[1240px] border-line border-t px-6 py-10 text-mist/50 text-sm">
      <p>
        Screens captured on {CAPTURED_ON} from production builds of both versions. Frutiger is
        licensed to the NHS, so it appears here only as an image.
      </p>
    </footer>
  );
}
