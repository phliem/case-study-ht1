import { LockIcon } from "./LockIcon";

type BrowserChromeProps = { address: string };

export function BrowserChrome({ address }: BrowserChromeProps) {
  return (
    <div aria-hidden="true" className="flex h-11 items-center gap-3 border-white/10 border-b px-4">
      <span className="flex w-14 gap-1.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <span className="mx-auto flex h-7 w-[min(360px,60%)] min-w-0 items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-3 text-mist/70 text-xs">
        <LockIcon />
        <span className="truncate">{address}</span>
      </span>
      <span className="w-14" />
    </div>
  );
}
