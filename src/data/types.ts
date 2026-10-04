export type PageId = "home" | "article" | "help";
export type Version = "before" | "after";
export type Device = "desktop" | "mobile";
export type HomeSectionId = "hero" | "proof" | "how" | "faq-about" | "areas" | "footer";
export type ArticleSectionId = "title" | "guide" | "questions" | "next" | "footer";
export type HelpSectionId = "title" | "questions" | "more-help" | "footer";
export type SectionIdOf = { home: HomeSectionId; article: ArticleSectionId; help: HelpSectionId };
export type SectionId = SectionIdOf[PageId];

export type Rect = { x: number; y: number; width: number; height: number };

export type Tile = { avif: string; webp: string; top: number; height: number };

export type PinnedState = { from: number; src: string; height: number; blur: number | null };

export type PinnedLayer = {
  id: string;
  x: number;
  y: number;
  width: number;
  stickTop: number;
  releaseAt: number;
  states: PinnedState[];
};

export type SectionTop = { id: SectionId; top: number };

export type Loop = {
  id: string;
  rect: Rect;
  radius: [number, number, number, number];
  mp4: string;
  webm: string;
  duration: number;
};

export type MeasuredTokens = {
  headline: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    fontWeight: string;
  };
  heroGround: string;
  search: { borderRadius: string; boxShadow: string };
  card: { borderRadius: string; boxShadow: string };
};

export type Capture = {
  page: PageId;
  version: Version;
  device: Device;
  commit: string;
  capturedAt: string;
  viewport: { width: number; height: number };
  scale: number;
  pageHeight: number;
  tiles: Tile[];
  sections: SectionTop[];
  pinned: PinnedLayer[];
  loops: Loop[];
};

export type PaletteGroup = { name: string; swatches: { name: string; hex: string }[] };

export type CapturesFile = {
  captures: Capture[];
  tokens: { before: MeasuredTokens; after: MeasuredTokens };
  palettes: { before: PaletteGroup[]; after: PaletteGroup[] };
  radiusScale: string[];
  specimens: { frutiger: string };
};
