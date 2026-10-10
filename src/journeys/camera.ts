import { clamp, lerp } from "../lib/math";
import { type Point, type ScreenBox, type Size, TEXT_HEIGHT } from "./layout";

export type Camera = { x: number; y: number; zoom: number };

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2.5;
const FIT_TOP = 80;
const FIT_BOTTOM = 50;
const FIT_SIDES = 80;

export function fitCamera(viewport: Size, board: Size): Camera {
  const zoom = clamp(
    Math.min(
      (viewport.width - FIT_SIDES) / board.width,
      (viewport.height - FIT_TOP - FIT_BOTTOM) / board.height,
    ),
    0.05,
    1,
  );
  return {
    x: (viewport.width - board.width * zoom) / 2,
    y: FIT_TOP + (viewport.height - FIT_TOP - board.height * zoom) / 2,
    zoom,
  };
}

export function zoomAround(camera: Camera, factor: number, anchor: Point): Camera {
  const zoom = clamp(camera.zoom * factor, Math.min(MIN_ZOOM, camera.zoom), MAX_ZOOM);
  const scale = zoom / camera.zoom;
  return {
    x: anchor.x - (anchor.x - camera.x) * scale,
    y: anchor.y - (anchor.y - camera.y) * scale,
    zoom,
  };
}

export function centreOn(camera: Camera, box: ScreenBox, viewport: Size): Camera {
  return {
    x: viewport.width / 2 - box.centreX * camera.zoom,
    y: viewport.height / 2 - (box.y + (box.height + TEXT_HEIGHT) / 2) * camera.zoom,
    zoom: camera.zoom,
  };
}

export function lerpCamera(from: Camera, to: Camera, t: number): Camera {
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), zoom: lerp(from.zoom, to.zoom, t) };
}
