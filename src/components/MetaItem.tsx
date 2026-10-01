import type { ReactNode } from "react";

type MetaItemProps = { term: string; children: ReactNode };

export function MetaItem({ term, children }: MetaItemProps) {
  return (
    <div>
      <dt className="caption text-mist/50">{term}</dt>
      <dd className="mt-2 text-mist">{children}</dd>
    </div>
  );
}
