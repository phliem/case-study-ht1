import type { Ref } from "react";
import type { Size } from "./layout";

export type DrawnEdge = { key: string; path: string; delay: number; lit: boolean; faded: boolean };

type FlowEdgesProps = { ref: Ref<SVGSVGElement>; edges: readonly DrawnEdge[]; size: Size };

export function FlowEdges({ ref, edges, size }: FlowEdgesProps) {
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      width={size.width}
      height={size.height}
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
    >
      {edges.map((edge) => (
        <path
          key={edge.key}
          d={edge.path}
          data-edge={edge.key}
          data-delay={edge.delay}
          fill="none"
          strokeLinecap="round"
          className={`transition-[stroke,opacity,stroke-width] duration-300 ${edge.lit ? "stroke-3 stroke-accent" : "stroke-2 stroke-edge"} ${edge.faded ? "opacity-30" : "opacity-100"}`}
        />
      ))}
    </svg>
  );
}
