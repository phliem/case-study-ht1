import { PlayIcon } from "./PlayIcon";

type PlayButtonProps = { playing: boolean; onToggle: () => void };

export function PlayButton({ playing, onToggle }: PlayButtonProps) {
  return (
    <button
      type="button"
      data-play-button=""
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 font-extrabold text-ink text-sm transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2"
    >
      <PlayIcon playing={playing} />
      {playing ? "Stop" : "Play"}
    </button>
  );
}
