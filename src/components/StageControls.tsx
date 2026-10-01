import type { Device } from "../data/types";
import { DeviceToggle } from "./DeviceToggle";
import { PlayButton } from "./PlayButton";

type StageControlsProps = {
  device: Device;
  onDeviceChange: (device: Device) => void;
  playing: boolean;
  onTogglePlay: () => void;
};

export function StageControls({
  device,
  onDeviceChange,
  playing,
  onTogglePlay,
}: StageControlsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <DeviceToggle device={device} onChange={onDeviceChange} />
      <PlayButton playing={playing} onToggle={onTogglePlay} />
      <p className="text-mist/50 text-sm">Drag the divider · scroll inside the frame</p>
    </div>
  );
}
