import { type MotionValue, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { assetUrl } from "../data/captures";
import type { PinnedLayer } from "../data/types";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { pinnedStateIndex, pinnedTop } from "../lib/pinned";

type PinnedLayerViewProps = { layer: PinnedLayer; scroll: MotionValue<number>; eager: boolean };

export function PinnedLayerView({ layer, scroll, eager }: PinnedLayerViewProps) {
  const [shown, setShown] = useState(() => pinnedStateIndex(layer, scroll.get()));
  const position = useLiveStyle<HTMLDivElement>(
    scroll,
    "transform",
    (pagePx) => `translate(${layer.x}px, ${pinnedTop(layer, pagePx) - pagePx}px)`,
  );
  useMotionValueEvent(scroll, "change", (pagePx) => setShown(pinnedStateIndex(layer, pagePx)));
  return (
    <div
      ref={position.ref}
      data-testid={`pinned-${layer.id}`}
      data-state={shown}
      className="absolute top-0 left-0"
      style={{ ...position.style, width: layer.width }}
    >
      {layer.states.map((state, index) => (
        <div
          key={state.src}
          data-testid={`pinned-${layer.id}-${index}`}
          className="absolute top-0 left-0 transition-opacity duration-[250ms]"
          style={{
            width: layer.width,
            height: state.height,
            opacity: index === shown ? 1 : 0,
            backdropFilter: state.blur === null ? undefined : `blur(${state.blur}px)`,
          }}
        >
          <img
            src={assetUrl(state.src)}
            alt=""
            width={Math.round(layer.width)}
            height={Math.round(state.height)}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="block max-w-none"
            style={{ width: layer.width, height: state.height }}
          />
        </div>
      ))}
    </div>
  );
}
