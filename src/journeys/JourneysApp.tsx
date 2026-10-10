import { JourneyBoard } from "./JourneyBoard";
import { JourneysHeader } from "./JourneysHeader";
import { REGISTRATION_FLOW } from "./registrationFlow";

const STEP_MS = 3000;

export function JourneysApp() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
      <JourneysHeader />
      <JourneyBoard flow={REGISTRATION_FLOW} stepMs={STEP_MS} />
    </div>
  );
}
