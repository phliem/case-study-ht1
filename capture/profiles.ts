import type { Device } from "../src/data/types";

export type DeviceProfile = {
  device: Device;
  viewport: { width: number; height: number };
  isMobile: boolean;
  hasTouch: boolean;
  userAgent: string | undefined;
};

export const SCALE = 2;
export const TILE_HEIGHT = 2000;
export const FPS = 30;

export const SOCS_REJECTED = JSON.stringify(JSON.stringify({ status: "rejected" }));

export const DEVICE_PROFILES: Record<Device, DeviceProfile> = {
  desktop: {
    device: "desktop",
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
    userAgent: undefined,
  },
  mobile: {
    device: "mobile",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  },
};
