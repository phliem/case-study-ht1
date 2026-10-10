import { useCallback, useEffect, useRef, useState } from "react";

const OPENS_AFTER_MS = 3000;

export type HelpBubbleState = { open: boolean; toggle: () => void; dismiss: () => void };

export function useHelpBubble(): HelpBubbleState {
  const [open, setOpen] = useState(false);
  const settled = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!settled.current) setOpen(true);
    }, OPENS_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const toggle = useCallback(() => {
    settled.current = true;
    setOpen((current) => !current);
  }, []);
  const dismiss = useCallback(() => {
    settled.current = true;
    setOpen(false);
  }, []);
  return { open, toggle, dismiss };
}
