import type { MeasuredTokens, PaletteGroup } from "../data/types";

export function typefaceName(fontFamily: string): string {
  const family = fontFamily.toLowerCase();
  if (family.includes("frutiger")) return "Frutiger";
  if (family.includes("hanken")) return "Hanken Grotesk";
  return (fontFamily.split(",")[0] ?? fontFamily).replace(/["']/g, "").trim();
}

export function headlineSummary(headline: MeasuredTokens["headline"]): string {
  const tracking =
    headline.letterSpacing === "normal" ? "no tracking" : `${headline.letterSpacing} tracking`;
  return `${headline.fontSize} / ${headline.lineHeight} · ${headline.fontWeight} · ${tracking}`;
}

export function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function isTransparent(layer: string): boolean {
  return /rgba\([^)]*,\s*0\)/.test(layer) || layer.includes("transparent");
}

export function shadowSummary(boxShadow: string): string {
  const layers =
    boxShadow === "none" ? [] : splitTopLevel(boxShadow).filter((layer) => !isTransparent(layer));
  if (layers.length === 0) return "No shadow";
  const blurs = layers.map((layer) => {
    const lengths =
      layer.replace(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi, "").match(/-?[\d.]+px/g) ?? [];
    return Number.parseFloat(lengths[2] ?? "0");
  });
  const deepest = Math.max(...blurs);
  return layers.length === 1
    ? `1 layer, ${deepest}px blur`
    : `${layers.length} layers, up to ${deepest}px blur`;
}

export function rgbToHex(rgb: string): string {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!match) return rgb;
  const hex = match
    .slice(1, 4)
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex.toUpperCase()}`;
}

export function groundSummary(ground: string): string {
  if (ground.startsWith("radial-gradient")) {
    const stops = ground.match(/rgba?\(|#[0-9a-f]{3,8}\b/gi)?.length ?? 0;
    return `Radial gradient, ${stops} stops`;
  }
  if (ground.startsWith("linear-gradient")) return "Linear gradient";
  return `Flat ${rgbToHex(ground)}`;
}

export function colourCount(groups: readonly PaletteGroup[]): number {
  return groups.reduce((total, group) => total + group.swatches.length, 0);
}
