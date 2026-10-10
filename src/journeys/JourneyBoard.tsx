import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EdgeLabel } from "./EdgeLabel";
import { FlowEdges } from "./FlowEdges";
import { edgeKey, type Flow, type Journey, screenOf } from "./flow";
import { HelpBubble } from "./HelpBubble";
import { type Highlight, journeySoFar, routeTo } from "./highlight";
import { JourneyControls } from "./JourneyControls";
import { boardSize, curvePath, edgeCurve, pointOnCurve, screenBox } from "./layout";
import { PlayCursor } from "./PlayCursor";
import type { Playback } from "./playback";
import { ScreenCard } from "./ScreenCard";
import { useBoardCamera } from "./useBoardCamera";
import { useFrameLoop } from "./useFrameLoop";
import { useHelpBubble } from "./useHelpBubble";
import { usePlayback } from "./usePlayback";
import { usePlayCursor } from "./usePlayCursor";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useReveal } from "./useReveal";
import { ZoomControls } from "./ZoomControls";

type JourneyBoardProps = { flow: Flow; stepMs: number };

const STAGGER_MS = 400;
const EDGE_DELAY_MS = 600;
const ZOOM_STEP = 1.2;

function highlightOf(flow: Flow, playback: Playback, hovered: string | null): Highlight | null {
  if (playback.playing) return journeySoFar(playback.journey, playback.step);
  return hovered ? routeTo(flow.edges, hovered) : null;
}

export function JourneyBoard({ flow, stepMs }: JourneyBoardProps) {
  const viewportRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const zoomLabelRef = useRef<HTMLSpanElement>(null);
  const edgesRef = useRef<SVGSVGElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const help = useHelpBubble();

  const board = useMemo(() => boardSize(flow.screens), [flow]);
  const edges = useMemo(
    () =>
      flow.edges.map((edge) => {
        const from = screenOf(flow, edge.from);
        const curve = edgeCurve(from, screenOf(flow, edge.to));
        return {
          key: edgeKey(edge.from, edge.to),
          label: edge.label,
          path: curvePath(curve),
          midpoint: pointOnCurve(curve, 0.5),
          delay: from.column * STAGGER_MS + EDGE_DELAY_MS,
        };
      }),
    [flow],
  );

  const camera = useBoardCamera({
    viewportRef,
    layerRef,
    zoomLabelRef,
    board,
    reduced,
    onInteract: help.dismiss,
  });
  const followStep = useCallback(
    (state: Playback) => camera.follow(screenBox(screenOf(flow, state.journey.path[state.step]))),
    [camera, flow],
  );
  const controls = usePlayback({ firstJourney: flow.journeys[0], stepMs, onStep: followStep });
  const playback = controls.state;
  const reveal = useReveal(edgesRef, reduced);
  const drawCursor = usePlayCursor({ flow, edgesRef, cursorRef, rippleRef });
  useFrameLoop((now) => {
    camera.tick(now);
    drawCursor(now, controls.latest.current);
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const over = (event: MouseEvent) => {
      const card =
        event.target instanceof Element ? event.target.closest<HTMLElement>("[data-screen]") : null;
      if (!card) setHovered(null);
      else if (!controls.latest.current.playing) setHovered(card.dataset.screen ?? null);
    };
    const leave = () => setHovered(null);
    viewport.addEventListener("mouseover", over);
    viewport.addEventListener("mouseleave", leave);
    return () => {
      viewport.removeEventListener("mouseover", over);
      viewport.removeEventListener("mouseleave", leave);
    };
  }, [controls.latest]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      const state = controls.latest.current;
      if (!state.playing) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        controls.step(event.key === "ArrowRight" ? 1 : -1);
      }
      const onButton = event.target instanceof Element && event.target.closest("button");
      if (event.key === " " && !onButton) {
        event.preventDefault();
        if (state.paused) controls.resume();
        else controls.pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controls]);

  const highlight = highlightOf(flow, playback, hovered);
  const toggleMenu = () => {
    help.dismiss();
    setMenuOpen((open) => !open);
  };
  const pick = (journey: Journey) => {
    setMenuOpen(false);
    setHovered(null);
    controls.play(journey);
  };

  return (
    <main
      ref={viewportRef}
      className="relative min-h-0 flex-auto cursor-grab touch-none select-none overflow-hidden border-line border-t"
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-line) 1.2px, transparent 1.3px)",
      }}
    >
      <div className="absolute top-6 left-0 size-full overflow-hidden">
        <div
          ref={layerRef}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: board.width, height: board.height }}
        >
          <FlowEdges
            ref={edgesRef}
            size={board}
            edges={edges.map((edge) => ({
              key: edge.key,
              path: edge.path,
              delay: edge.delay,
              lit: highlight?.edges.has(edge.key) ?? false,
              faded: highlight !== null && !highlight.edges.has(edge.key),
            }))}
          />
          {edges.map((edge) => {
            const faded = highlight !== null && !highlight.edges.has(edge.key);
            const delay = reveal.revealed && !reveal.settled ? edge.delay + 1000 : 0;
            return (
              <EdgeLabel
                key={edge.key}
                label={edge.label}
                at={edge.midpoint}
                lit={highlight?.edges.has(edge.key) ?? false}
                opacity={reveal.revealed ? (faded ? 0.35 : 1) : 0}
                transition={
                  reveal.animated
                    ? `opacity 1s ease ${delay}ms, background-color .3s, color .3s`
                    : "none"
                }
              />
            );
          })}
          {flow.screens.map((screen) => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              box={screenBox(screen)}
              delay={screen.column * STAGGER_MS}
              revealed={reveal.revealed}
              animated={reveal.animated}
              active={highlight?.active === screen.id}
              dimmed={highlight !== null && !highlight.screens.has(screen.id)}
            />
          ))}
          <PlayCursor cursorRef={cursorRef} rippleRef={rippleRef} />
        </div>
      </div>
      <JourneyControls
        journeys={flow.journeys}
        playback={playback}
        controls={controls}
        menuOpen={menuOpen}
        onToggleMenu={toggleMenu}
        onPick={pick}
      />
      <HelpBubble open={help.open} onToggle={help.toggle} />
      <ZoomControls
        labelRef={zoomLabelRef}
        onZoomIn={() => camera.zoomBy(ZOOM_STEP)}
        onZoomOut={() => camera.zoomBy(1 / ZOOM_STEP)}
        onFit={camera.fit}
      />
    </main>
  );
}
