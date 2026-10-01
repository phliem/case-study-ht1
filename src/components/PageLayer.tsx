import type { RefObject } from "react";
import type { Capture } from "../data/types";
import { LiveLoop } from "./LiveLoop";
import { PageTile } from "./PageTile";

type PageLayerProps = {
  capture: Capture;
  scale: number;
  alt: string;
  live: boolean;
  root: RefObject<Element | null>;
};

export function PageLayer({ capture, scale, alt, live, root }: PageLayerProps) {
  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: capture.viewport.width,
        height: capture.pageHeight,
        transform: `scale(${scale})`,
      }}
    >
      {capture.tiles.map((tile, index) => (
        <PageTile
          key={tile.webp}
          tile={tile}
          width={capture.viewport.width}
          eager={index === 0}
          alt={index === 0 ? alt : ""}
        />
      ))}
      {live && capture.loops.map((loop) => <LiveLoop key={loop.id} loop={loop} root={root} />)}
    </div>
  );
}
