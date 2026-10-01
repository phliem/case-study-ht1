import type { Device } from "../data/types";
import { DeviceToggle } from "./DeviceToggle";

type StageControlsProps = { device: Device; onDeviceChange: (device: Device) => void };

export function StageControls({ device, onDeviceChange }: StageControlsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <DeviceToggle device={device} onChange={onDeviceChange} />
      <p className="text-mist/50 text-sm">Drag the divider · scroll inside the frame</p>
    </div>
  );
}
