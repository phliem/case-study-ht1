import { LayoutGroup, useInView, useMotionValue } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { captureFor } from "../data/captures";
import { addressOf, PAGES } from "../data/pages";
import type { Device, PageId, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { type PlaybackTargets, usePlayback } from "../hooks/usePlayback";
import { TOURS } from "../lib/playScript";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import type { RecordAspect, UrlOptions } from "../lib/urlOptions";
import { ChangeCallouts } from "./ChangeCallouts";
import { DeviceFrame } from "./DeviceFrame";
import { type RailLayout, SectionRail } from "./SectionRail";
import { StageControls } from "./StageControls";
import { StageIntro } from "./StageIntro";
import { StageViewport, type StageViewportHandle } from "./StageViewport";

type ComparisonStageProps = { page: PageId; options: UrlOptions; eager: boolean };

type StageLayout = {
  root: string;
  box: string;
  grid: string;
  frame: string;
  side: string;
  rail: RailLayout;
};

type DeviceMaps = Record<Device, SectionMap>;

function mapsFor(page: PageId): DeviceMaps {
  const mapFor = (device: Device) => {
    const after = captureFor(page, "after", device);
    return createSectionMap(after, captureFor(page, "before", device), after.viewport.height);
  };
  return { desktop: mapFor("desktop"), mobile: mapFor("mobile") };
}

const MAPS: Record<PageId, DeviceMaps> = {
  home: mapsFor("home"),
  article: mapsFor("article"),
  help: mapsFor("help"),
};

const INPUTS = ["pointerdown", "wheel", "keydown", "touchstart"] as const;

const PAGE_LAYOUT: StageLayout = {
  root: "relative w-full",
  box: "@container/stage relative mx-auto w-full max-w-[1480px] px-4 sm:px-6",
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

export function ComparisonStage({ page, options, eager }: ComparisonStageProps) {
  const { reduced } = useMotionPreference();
  const info = PAGES[page];
  const maps = MAPS[page];
  const recording = options.record !== null;
  const headingId = useId();
  const layout = options.record === null ? PAGE_LAYOUT : RECORD_LAYOUTS[options.record];
  const [device, setDevice] = useState<Device>(() => (recording ? "desktop" : initialDevice()));
  const [group, setGroup] = useState<SectionId>(info.sections[0].id);
  const divider = useMotionValue(recording ? 1 : 0.5);
  const stage = useRef<HTMLElement>(null);
  const near = useInView(stage, { once: true, margin: "25% 0px" });
  const viewport = useRef<StageViewportHandle>(null);
  const deviceRef = useRef(device);
  const pendingScroll = useRef(0);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  const changeDevice = useCallback(
    (next: Device) => {
      const current = deviceRef.current;
      if (next === current) return;
      const scroll = viewport.current?.getScroll() ?? 0;
      pendingScroll.current = maps[next].scrollForGroup(maps[current].groupAt(scroll));
      setDevice(next);
    },
    [maps],
  );

  const targets = useMemo<PlaybackTargets>(
    () => ({
      divider,
      resolve: (forDevice, target) =>
        target === "top" ? 0 : maps[forDevice].scrollForGroup(target),
      setDevice: (next, scrollTop) => {
        pendingScroll.current = scrollTop;
        setDevice(next);
      },
      scrollTo: (pagePx, onDevice) => {
        if (onDevice === deviceRef.current) viewport.current?.scrollTo(pagePx);
      },
    }),
    [divider, maps],
  );

  const { playing, play, stop } = usePlayback(TOURS[page][options.tour], targets, {
    loop: recording,
    cut: reduced,
  });

  useEffect(() => {
    if (recording) play();
  }, [recording, play]);

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
      viewport.current?.glideTo(maps[deviceRef.current].scrollForGroup(id), reduced ? 0 : 0.9);
    },
    [maps, reduced],
  );

  const after = captureFor(page, "after", device);
  return (
    <section
      ref={stage}
      aria-labelledby={recording ? undefined : headingId}
      aria-label={recording ? info.name : undefined}
      data-group={group}
      className={layout.root}
    >
      <LayoutGroup id={page}>
        {!recording && <StageIntro page={page} headingId={headingId} />}
        <div className={layout.box}>
          <div data-testid="stage-grid" className={layout.grid}>
            <div className={layout.side}>
              <SectionRail page={page} active={group} onSelect={glideTo} layout={layout.rail} />
            </div>
            <div className={layout.frame}>
              <DeviceFrame device={device} viewport={after.viewport} address={addressOf(page)}>
                {(eager || near) && (
                  <StageViewport
                    key={device}
                    ref={viewport}
                    page={page}
                    device={device}
                    divider={divider}
                    map={maps[device]}
                    live={!reduced}
                    eager={eager}
                    initialScroll={pendingScroll.current}
                    onGroupChange={setGroup}
                  />
                )}
              </DeviceFrame>
            </div>
            <div className={layout.side}>
              <ChangeCallouts page={page} group={group} />
            </div>
          </div>
          {!recording && (
            <StageControls
              device={device}
              onDeviceChange={changeDevice}
              playing={playing}
              onTogglePlay={playing ? stop : play}
            />
          )}
        </div>
      </LayoutGroup>
    </section>
  );
}
