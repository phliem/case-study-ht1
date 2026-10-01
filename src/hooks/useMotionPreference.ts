import { createContext, useContext } from "react";

export type MotionPreference = { reduced: boolean };

export const MotionPreferenceContext = createContext<MotionPreference>({ reduced: false });

export function useMotionPreference(): MotionPreference {
  return useContext(MotionPreferenceContext);
}
