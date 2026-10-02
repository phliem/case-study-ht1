import type { MotionValue } from "motion/react";
import type { PinnedLayer } from "../data/types";
import { PinnedLayerView } from "./PinnedLayerView";

type PinnedLayersProps = {
  layers: readonly PinnedLayer[];
  width: number;
  scale: number;
  scroll: MotionValue<number>;
  eager: boolean;
};

export function PinnedLayers({ layers, width, scale, scroll, eager }: PinnedLayersProps) {
  if (layers.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ width, transform: `scale(${scale})` }}
    >
      {layers.map((layer) => (
        <PinnedLayerView key={layer.id} layer={layer} scroll={scroll} eager={eager} />
      ))}
    </div>
  );
}
