import { useMotionValue } from "motion/react";
import { useState } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import { DeviceFrame } from "./DeviceFrame";
import { StageViewport } from "./StageViewport";

function mapFor(device: Device): SectionMap {
  const after = captureFor("after", device);
  return createSectionMap(after, captureFor("before", device), after.viewport.height);
}

const MAPS: Record<Device, SectionMap> = { desktop: mapFor("desktop"), mobile: mapFor("mobile") };

function initialDevice(): Device {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function ComparisonStage() {
  const { reduced } = useMotionPreference();
  const [device] = useState<Device>(initialDevice);
  const [group, setGroup] = useState<SectionId>("hero");
  const divider = useMotionValue(0.5);
  const after = captureFor("after", device);
  return (
    <section
      aria-label="Before and after comparison"
      data-group={group}
      className="relative mx-auto w-full max-w-[1480px] px-4 sm:px-6"
    >
      <div className="grid h-[min(80svh,900px)] min-h-[440px] place-items-center [container-type:size]">
        <DeviceFrame device={device} viewport={after.viewport}>
          <StageViewport
            key={device}
            device={device}
            divider={divider}
            map={MAPS[device]}
            live={!reduced}
            initialScroll={0}
            onGroupChange={setGroup}
          />
        </DeviceFrame>
      </div>
    </section>
  );
}
