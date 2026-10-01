import type { Capture } from "../data/types";
import { PageTile } from "./PageTile";

type PageLayerProps = { capture: Capture; scale: number; alt: string };

export function PageLayer({ capture, scale, alt }: PageLayerProps) {
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
    </div>
  );
}
