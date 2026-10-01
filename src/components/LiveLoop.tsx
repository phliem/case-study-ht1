import { useInView } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { assetUrl } from "../data/captures";
import type { Loop } from "../data/types";

type LiveLoopProps = { loop: Loop; root: RefObject<Element | null> };

export function LiveLoop({ loop, root }: LiveLoopProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const inView = useInView(video, { root, margin: "300px 0px" });

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setArmed(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setArmed(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (armed) video.current?.load();
  }, [armed]);

  useEffect(() => {
    const element = video.current;
    if (!element || !armed) return;
    if (inView) {
      element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  }, [armed, inView]);

  const [topLeft, topRight, bottomRight, bottomLeft] = loop.radius;
  return (
    <video
      ref={video}
      muted
      loop
      playsInline
      preload={armed ? "auto" : "none"}
      tabIndex={-1}
      aria-hidden="true"
      data-testid="live-loop"
      onPlaying={() => setPlaying(true)}
      className="absolute max-w-none object-cover transition-opacity duration-300"
      style={{
        left: loop.rect.x,
        top: loop.rect.y,
        width: loop.rect.width,
        height: loop.rect.height,
        borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
        opacity: playing ? 1 : 0,
      }}
    >
      {armed && (
        <>
          <source src={assetUrl(loop.webm)} type='video/webm; codecs="vp9"' />
          <source src={assetUrl(loop.mp4)} type="video/mp4" />
        </>
      )}
    </video>
  );
}
