export type Band = { top: number; height: number };

export type ViewportStop = {
  scrollY: number;
  sliceTop: number;
  sliceHeight: number;
  pageTop: number;
};

export function tileBands(pageHeight: number, tileHeight: number): Band[] {
  const bands: Band[] = [];
  for (let top = 0; top < pageHeight; top += tileHeight) {
    bands.push({ top, height: Math.min(tileHeight, pageHeight - top) });
  }
  return bands;
}

export function viewportStops(pageHeight: number, viewportHeight: number): ViewportStop[] {
  const maxScroll = Math.max(0, pageHeight - viewportHeight);
  const stops: ViewportStop[] = [];
  for (let pageTop = 0; pageTop < pageHeight; pageTop += viewportHeight) {
    const scrollY = Math.min(pageTop, maxScroll);
    const sliceTop = pageTop - scrollY;
    stops.push({
      scrollY,
      sliceTop,
      sliceHeight: Math.min(viewportHeight - sliceTop, pageHeight - pageTop),
      pageTop,
    });
  }
  return stops;
}
