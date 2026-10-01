type PlayIconProps = { playing: boolean };

export function PlayIcon({ playing }: PlayIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      {playing ? (
        <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
      ) : (
        <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5Z" />
      )}
    </svg>
  );
}
