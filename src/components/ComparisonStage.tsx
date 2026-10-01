import { useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import { ChangeCallouts } from "./ChangeCallouts";
import { DeviceFrame } from "./DeviceFrame";
import { SectionRail } from "./SectionRail";
import { StageControls } from "./StageControls";
import { StageViewport, type StageViewportHandle } from "./StageViewport";

function mapFor(device: Device): SectionMap {
  const after = captureFor("after", device);
  return createSectionMap(after, captureFor("before", device), after.viewport.height);
}

const MAPS: Record<Device, SectionMap> = { desktop: mapFor("desktop"), mobile: mapFor("mobile") };

const LAYOUT = {
  grid: "grid gap-5 @min-[1100px]/stage:h-[min(86svh,940px)] @min-[1100px]/stage:min-h-[600px] @min-[1100px]/stage:grid-cols-[160px_minmax(0,1fr)_300px] @min-[1100px]/stage:gap-8",
  frame:
    "grid h-[min(78svh,760px)] min-h-[420px] place-items-center [container-type:size] @min-[1100px]/stage:h-auto @min-[1100px]/stage:min-h-0",
  side: "min-w-0 @min-[1100px]/stage:self-center",
};

function initialDevice(): Device {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function ComparisonStage() {
  const { reduced } = useMotionPreference();
  const [device, setDevice] = useState<Device>(initialDevice);
  const [group, setGroup] = useState<SectionId>("hero");
  const divider = useMotionValue(0.5);
  const viewport = useRef<StageViewportHandle>(null);
  const deviceRef = useRef(device);
  const pendingScroll = useRef(0);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  const changeDevice = useCallback((next: Device) => {
    const current = deviceRef.current;
    if (next === current) return;
    const scroll = viewport.current?.getScroll() ?? 0;
    pendingScroll.current = MAPS[next].scrollForGroup(MAPS[current].groupAt(scroll));
    setDevice(next);
  }, []);

  const glideTo = useCallback(
    (id: SectionId) => {
      viewport.current?.glideTo(MAPS[deviceRef.current].scrollForGroup(id), reduced ? 0 : 0.9);
    },
    [reduced],
  );

  const after = captureFor("after", device);
  return (
    <section
      aria-label="Before and after comparison"
      data-group={group}
      className="@container/stage relative mx-auto w-full max-w-[1480px] px-4 sm:px-6"
    >
      <div className={LAYOUT.grid}>
        <div className={LAYOUT.side}>
          <SectionRail active={group} onSelect={glideTo} layout="responsive" />
        </div>
        <div className={LAYOUT.frame}>
          <DeviceFrame device={device} viewport={after.viewport}>
            <StageViewport
              key={device}
              ref={viewport}
              device={device}
              divider={divider}
              map={MAPS[device]}
              live={!reduced}
              initialScroll={pendingScroll.current}
              onGroupChange={setGroup}
            />
          </DeviceFrame>
        </div>
        <div className={LAYOUT.side}>
          <ChangeCallouts group={group} />
        </div>
      </div>
      <StageControls device={device} onDeviceChange={changeDevice} />
    </section>
  );
}
