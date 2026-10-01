import { assetUrl } from "../data/captures";
import type { Tile } from "../data/types";

type PageTileProps = { tile: Tile; width: number; eager: boolean; alt: string };

export function PageTile({ tile, width, eager, alt }: PageTileProps) {
  return (
    <picture>
      <source srcSet={assetUrl(tile.avif)} type="image/avif" />
      <img
        src={assetUrl(tile.webp)}
        alt={alt}
        width={width}
        height={tile.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className="absolute left-0 block max-w-none select-none"
        style={{ top: tile.top, width, height: tile.height }}
      />
    </picture>
  );
}
