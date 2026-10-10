import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { clamp, smoothstep } from "../lib/math";
import { type Camera, centreOn, fitCamera, lerpCamera, zoomAround } from "./camera";
import type { Point, ScreenBox, Size } from "./layout";

type Glide = { from: Camera; to: Camera; startedAt: number; duration: number };

type BoardCameraOptions = {
  viewportRef: RefObject<HTMLElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
  zoomLabelRef: RefObject<HTMLSpanElement | null>;
  board: Size;
  reduced: boolean;
  onInteract: () => void;
};

export type BoardCamera = {
  tick: (now: number) => void;
  zoomBy: (factor: number) => void;
  fit: () => void;
  follow: (box: ScreenBox) => void;
};

const GRID = 24;
const DRAG_THRESHOLD = 4;
const WHEEL_LINE = 16;
const FIT_MS = 500;
const FOLLOW_MS = 700;

function wheelUnit(event: WheelEvent, page: number): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return WHEEL_LINE;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return page;
  return 1;
}

// A drag that ends over a button would otherwise click it.
function swallowNextClick() {
  const swallow = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 50);
}

export function useBoardCamera({
  viewportRef,
  layerRef,
  zoomLabelRef,
  board,
  reduced,
  onInteract,
}: BoardCameraOptions): BoardCamera {
  const camera = useRef<Camera | null>(null);
  const glide = useRef<Glide | null>(null);
  const latest = useRef({ reduced, onInteract });
  useLayoutEffect(() => {
    latest.current = { reduced, onInteract };
  });

  const apply = useCallback(() => {
    const viewport = viewportRef.current;
    const layer = layerRef.current;
    const current = camera.current;
    if (!viewport || !layer || !current) return;
    layer.style.transform = `translate(${current.x}px, ${current.y}px) scale(${current.zoom})`;
    const grid = GRID * current.zoom;
    viewport.style.backgroundSize = `${grid}px ${grid}px`;
    viewport.style.backgroundPosition = `${current.x}px ${current.y}px`;
    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${Math.round(current.zoom * 100)}%`;
    }
  }, [viewportRef, layerRef, zoomLabelRef]);

  const set = useCallback(
    (next: Camera) => {
      glide.current = null;
      camera.current = next;
      apply();
    },
    [apply],
  );

  const glideTo = useCallback(
    (to: Camera, duration: number) => {
      const from = camera.current;
      if (!from || latest.current.reduced) {
        set(to);
        return;
      }
      glide.current = { from, to, startedAt: performance.now(), duration };
    },
    [set],
  );

  const viewportSize = useCallback((): Size | null => {
    const viewport = viewportRef.current;
    return viewport ? { width: viewport.clientWidth, height: viewport.clientHeight } : null;
  }, [viewportRef]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fitOnce = () => {
      const size = viewportSize();
      if (camera.current || !size || size.width === 0) return;
      camera.current = fitCamera(size, board);
      apply();
    };
    fitOnce();
    const observer = new ResizeObserver(fitOnce);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewportRef, viewportSize, board, apply]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const layer = layerRef.current;
    if (!viewport || !layer) return;
    const stagePoint = (clientX: number, clientY: number): Point => {
      const stage = (layer.parentElement ?? viewport).getBoundingClientRect();
      return { x: clientX - stage.left, y: clientY - stage.top };
    };
    const pointers = new Map<number, Point>();
    let drag: { origin: Point; from: Camera; moved: boolean } | null = null;
    let pinch: { distance: number; centre: Point } | null = null;

    const measurePinch = () => {
      const [a, b] = [...pointers.values()];
      return {
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    };
    const startDrag = (origin: Point, moved: boolean) => {
      drag = camera.current ? { origin, from: camera.current, moved } : null;
    };

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest("[data-ui]")) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) startDrag({ x: event.clientX, y: event.clientY }, false);
      if (pointers.size !== 2) return;
      drag = null;
      pinch = measurePinch();
      latest.current.onInteract();
      for (const id of pointers.keys()) viewport.setPointerCapture(id);
    };

    const move = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = camera.current;
      if (!current) return;
      if (pinch && pointers.size >= 2) {
        const next = measurePinch();
        const zoomed = zoomAround(
          current,
          next.distance / pinch.distance,
          stagePoint(next.centre.x, next.centre.y),
        );
        set({
          ...zoomed,
          x: zoomed.x + next.centre.x - pinch.centre.x,
          y: zoomed.y + next.centre.y - pinch.centre.y,
        });
        pinch = next;
        return;
      }
      if (!drag) return;
      const dx = event.clientX - drag.origin.x;
      const dy = event.clientY - drag.origin.y;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!drag.moved) {
        drag.moved = true;
        latest.current.onInteract();
        viewport.setPointerCapture(event.pointerId);
        viewport.style.cursor = "grabbing";
      }
      set({ zoom: current.zoom, x: drag.from.x + dx, y: drag.from.y + dy });
    };

    const up = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      if (pinch) {
        if (pointers.size >= 2) return;
        pinch = null;
        swallowNextClick();
        const [remaining] = pointers.values();
        if (remaining) startDrag(remaining, true);
        return;
      }
      if (drag?.moved) swallowNextClick();
      if (pointers.size > 0) return;
      drag = null;
      viewport.style.cursor = "";
    };

    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      latest.current.onInteract();
      const current = camera.current;
      if (!current) return;
      const unit = wheelUnit(event, viewport.clientHeight);
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * unit * 0.01);
        set(zoomAround(current, factor, stagePoint(event.clientX, event.clientY)));
        return;
      }
      set({
        ...current,
        x: current.x - event.deltaX * unit,
        y: current.y - event.deltaY * unit,
      });
    };

    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", up);
    viewport.addEventListener("pointercancel", up);
    viewport.addEventListener("wheel", wheel, { passive: false });
    return () => {
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", up);
      viewport.removeEventListener("wheel", wheel);
    };
  }, [viewportRef, layerRef, set]);

  const tick = useCallback(
    (now: number) => {
      const active = glide.current;
      if (!active) return;
      const t = smoothstep(clamp((now - active.startedAt) / active.duration, 0, 1));
      camera.current = lerpCamera(active.from, active.to, t);
      apply();
      if (t >= 1) glide.current = null;
    },
    [apply],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      latest.current.onInteract();
      const size = viewportSize();
      const current = camera.current;
      if (!size || !current) return;
      set(zoomAround(current, factor, { x: size.width / 2, y: size.height / 2 }));
    },
    [viewportSize, set],
  );

  const fit = useCallback(() => {
    const size = viewportSize();
    if (size) glideTo(fitCamera(size, board), FIT_MS);
  }, [viewportSize, glideTo, board]);

  const follow = useCallback(
    (box: ScreenBox) => {
      const size = viewportSize();
      if (!size) return;
      glideTo(centreOn(camera.current ?? fitCamera(size, board), box, size), FOLLOW_MS);
    },
    [viewportSize, glideTo, board],
  );

  return useMemo(() => ({ tick, zoomBy, fit, follow }), [tick, zoomBy, fit, follow]);
}
