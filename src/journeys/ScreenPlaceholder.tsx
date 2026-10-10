type ScreenPlaceholderProps = { label: string };

export function ScreenPlaceholder({ label }: ScreenPlaceholderProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[rgb(127_127_127/0.08)] p-3 text-center font-system text-[13px] leading-[1.3]">
      <svg
        aria-hidden="true"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-45"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span className="max-w-[90%] font-medium tracking-[0.01em] opacity-75">{label}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-[1.5px] border-current border-dashed opacity-35"
      />
    </div>
  );
}
