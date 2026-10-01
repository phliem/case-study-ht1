import { m } from "motion/react";
import type { Device } from "../data/types";

type DeviceToggleProps = { device: Device; onChange: (device: Device) => void };

const OPTIONS: readonly { device: Device; label: string }[] = [
  { device: "desktop", label: "Desktop" },
  { device: "mobile", label: "Mobile" },
];

export function DeviceToggle({ device, onChange }: DeviceToggleProps) {
  return (
    <fieldset className="inline-flex rounded-full border border-line bg-white/[0.04] p-1">
      <legend className="sr-only">Device</legend>
      {OPTIONS.map((option) => (
        <button
          key={option.device}
          type="button"
          aria-pressed={device === option.device}
          onClick={() => onChange(option.device)}
          className="relative rounded-full px-4 py-1.5 font-bold text-mist/70 text-sm aria-pressed:text-ink"
        >
          {device === option.device && (
            <m.span
              layoutId="device-pill"
              className="absolute inset-0 rounded-full bg-mist"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </fieldset>
  );
}
