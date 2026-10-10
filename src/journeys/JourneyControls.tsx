import { useId } from "react";
import type { Journey } from "./flow";
import { JourneyMenu } from "./JourneyMenu";
import { JourneyPill } from "./JourneyPill";
import { PlayerControls } from "./PlayerControls";
import type { Playback } from "./playback";
import type { PlaybackControls } from "./usePlayback";

type JourneyControlsProps = {
  journeys: readonly Journey[];
  playback: Playback;
  controls: PlaybackControls;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onPick: (journey: Journey) => void;
};

export function JourneyControls({
  journeys,
  playback,
  controls,
  menuOpen,
  onToggleMenu,
  onPick,
}: JourneyControlsProps) {
  const menuId = useId();
  return (
    <div
      data-ui
      className="pointer-events-none absolute top-[18px] right-5 left-5 flex flex-nowrap items-center"
    >
      <div className="relative flex-none">
        <JourneyPill
          playing={playback.playing ? playback.journey : null}
          menuOpen={menuOpen}
          menuId={menuId}
          onToggleMenu={onToggleMenu}
          onStop={controls.stop}
        />
        <JourneyMenu id={menuId} journeys={journeys} open={menuOpen} onPick={onPick} />
        <PlayerControls
          visible={playback.playing && !menuOpen}
          paused={playback.paused}
          step={playback.step}
          steps={playback.journey.path.length}
          onPrevious={() => controls.step(-1)}
          onNext={() => controls.step(1)}
          onPause={controls.pause}
          onPlay={controls.resume}
        />
      </div>
    </div>
  );
}
