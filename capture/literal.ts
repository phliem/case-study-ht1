import type { PaletteGroup } from "../src/data/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractObjectLiteral(source: string, name: string): unknown {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const declaration = code.indexOf(`export const ${name} =`);
  if (declaration === -1) throw new Error(`${name} is not declared`);
  const open = code.indexOf("{", declaration);
  let depth = 0;
  for (let index = open; index < code.length; index++) {
    if (code[index] === "{") depth++;
    if (code[index] === "}") {
      depth--;
      if (depth === 0) return new Function(`return (${code.slice(open, index + 1)});`)();
    }
  }
  throw new Error(`${name} is never closed`);
}

export function paletteGroups(colors: unknown): PaletteGroup[] {
  if (!isRecord(colors)) throw new Error("A palette must be an object");
  return Object.entries(colors).map(([name, value]) => {
    if (typeof value === "string") return { name, swatches: [{ name, hex: value.toUpperCase() }] };
    if (!isRecord(value)) throw new Error(`${name} is neither a colour nor a set of colours`);
    return {
      name,
      swatches: Object.entries(value).map(([step, hex]) => {
        if (typeof hex !== "string") throw new Error(`${name}.${step} is not a colour`);
        return { name: step === "DEFAULT" ? name : `${name}-${step}`, hex: hex.toUpperCase() };
      }),
    };
  });
}
