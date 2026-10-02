import { m } from "motion/react";
import type { ReactNode } from "react";
import type { Device } from "../data/types";
import { BrowserChrome } from "./BrowserChrome";
import { PhoneIsland } from "./PhoneIsland";

type DeviceFrameProps = {
  device: Device;
  viewport: { width: number; height: number };
  address: string;
  children: ReactNode;
};

const CHROME = { desktop: { x: 0, y: 44 }, mobile: { x: 24, y: 52 } } as const;

export function DeviceFrame({ device, viewport, address, children }: DeviceFrameProps) {
  const chrome = CHROME[device];
  const ratio = viewport.width / viewport.height;
  const desktop = device === "desktop";
  return (
    <m.div
      layout
      transition={{ type: "spring", stiffness: 240, damping: 30 }}
      className={
        desktop
          ? "overflow-hidden bg-[#0d1f36] shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          : "bg-[#0a1424] px-3 pb-3 shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/12"
      }
      style={{
        width: `min(100cqw, calc((100cqh - ${chrome.y}px) * ${ratio} + ${chrome.x}px))`,
        borderRadius: desktop ? 18 : 52,
      }}
    >
      {desktop ? <BrowserChrome address={address} /> : <PhoneIsland />}
      <div
        className="relative overflow-hidden bg-ink-2"
        style={{
          aspectRatio: `${viewport.width} / ${viewport.height}`,
          borderRadius: desktop ? 0 : 40,
        }}
      >
        {children}
      </div>
    </m.div>
  );
}
