import { type ViewId, viewHref } from "../data/views";

type ViewLinkProps = { view: ViewId; direction: "back" | "forward"; children: string };

export function ViewLink({ view, direction, children }: ViewLinkProps) {
  return (
    <a
      href={viewHref(import.meta.env.BASE_URL, view)}
      className="font-bold underline decoration-mint underline-offset-4 hover:text-mint"
    >
      {direction === "back" && <span aria-hidden="true">← </span>}
      {children}
      {direction === "forward" && <span aria-hidden="true"> →</span>}
    </a>
  );
}
