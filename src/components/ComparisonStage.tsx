import { useMotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { type PlaybackTargets, usePlayback } from "../hooks/usePlayback";
import { FULL_TOUR, SHORT_TOUR } from "../lib/playScript";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import type { RecordAspect, UrlOptions } from "../lib/urlOptions";
import { ChangeCallouts } from "./ChangeCallouts";
import { DeviceFrame } from "./DeviceFrame";
import { type RailLayout, SectionRail } from "./SectionRail";
import { StageControls } from "./StageControls";
import { StageViewport, type StageViewportHandle } from "./StageViewport";

type ComparisonStageProps = { options: UrlOptions };

type StageLayout = {
  root: string;
  box: string;
  grid: string;
  frame: string;
  side: string;
  rail: RailLayout;
};

function mapFor(device: Device): SectionMap {
  const after = captureFor("home", "after", device);
  return createSectionMap(after, captureFor("home", "before", device), after.viewport.height);
}

const MAPS: Record<Device, SectionMap> = { desktop: mapFor("desktop"), mobile: mapFor("mobile") };

const INPUTS = ["pointerdown", "wheel", "keydown", "touchstart"] as const;

const PAGE_LAYOUT: StageLayout = {
  root: "@container/stage relative mx-auto w-full max-w-[1480px] px-4 sm:px-6",
  box: "",
  grid: "grid gap-5 @min-[1100px]/stage:h-[min(86svh,940px)] @min-[1100px]/stage:min-h-[600px] @min-[1100px]/stage:grid-cols-[160px_minmax(0,1fr)_300px] @min-[1100px]/stage:gap-8",
  frame:
    "grid h-[min(78svh,760px)] min-h-[420px] place-items-center [container-type:size] @min-[1100px]/stage:h-auto @min-[1100px]/stage:min-h-0",
  side: "min-w-0 @min-[1100px]/stage:self-center",
  rail: "responsive",
};

const RECORD_LAYOUTS: Record<RecordAspect, StageLayout> = {
  "16x9": {
    root: "fixed inset-0 grid cursor-none place-items-center bg-ink",
    box: "aspect-video w-[min(100vw,calc(100vh*16/9))]",
    grid: "grid h-full grid-cols-[180px_minmax(0,1fr)_320px] gap-10 p-10",
    frame: "grid min-h-0 place-items-center [container-type:size]",
    side: "min-w-0 self-center",
    rail: "vertical",
  },
  "4x3": {
    root: "fixed inset-0 grid cursor-none place-items-center bg-ink",
    box: "aspect-[4/3] w-[min(100vw,calc(100vh*4/3))]",
    grid: "grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-6 p-8",
    frame: "grid min-h-0 place-items-center [container-type:size]",
    side: "min-w-0 justify-self-center",
    rail: "horizontal",
  },
};

function initialDevice(): Device {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function ComparisonStage({ options }: ComparisonStageProps) {
  const { reduced } = useMotionPreference();
  const layout = options.record === null ? PAGE_LAYOUT : RECORD_LAYOUTS[options.record];
  const [device, setDevice] = useState<Device>(() =>
    options.record === null ? initialDevice() : "desktop",
  );
  const [group, setGroup] = useState<SectionId>("hero");
  const divider = useMotionValue(options.record === null ? 0.5 : 1);
  const stage = useRef<HTMLElement>(null);
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

  const targets = useMemo<PlaybackTargets>(
    () => ({
      divider,
      resolve: (forDevice, target) =>
        target === "top" ? 0 : MAPS[forDevice].scrollForGroup(target),
      setDevice: (next, scrollTop) => {
        pendingScroll.current = scrollTop;
        setDevice(next);
      },
      scrollTo: (pagePx, onDevice) => {
        if (onDevice === deviceRef.current) viewport.current?.scrollTo(pagePx);
      },
    }),
    [divider],
  );

  const script = options.tour === "short" ? SHORT_TOUR : FULL_TOUR;
  const { playing, play, stop } = usePlayback(script, targets, {
    loop: options.record !== null,
    cut: reduced,
  });

  useEffect(() => {
    if (options.record !== null) play();
  }, [options.record, play]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const interrupt = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-play-button]")) return;
      stop();
    };
    for (const name of INPUTS) element.addEventListener(name, interrupt, { passive: true });
    return () => {
      for (const name of INPUTS) element.removeEventListener(name, interrupt);
    };
  }, [stop]);

  const glideTo = useCallback(
    (id: SectionId) => {
      viewport.current?.glideTo(MAPS[deviceRef.current].scrollForGroup(id), reduced ? 0 : 0.9);
    },
    [reduced],
  );

  const after = captureFor("home", "after", device);
  return (
    <section
      ref={stage}
      aria-label="Before and after comparison"
      data-group={group}
      className={layout.root}
    >
      <div className={layout.box}>
        <div className={layout.grid}>
          <div className={layout.side}>
            <SectionRail active={group} onSelect={glideTo} layout={layout.rail} />
          </div>
          <div className={layout.frame}>
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
          <div className={layout.side}>
            <ChangeCallouts group={group} />
          </div>
        </div>
        {options.record === null && (
          <StageControls
            device={device}
            onDeviceChange={changeDevice}
            playing={playing}
            onTogglePlay={playing ? stop : play}
          />
        )}
      </div>
    </section>
  );
}
