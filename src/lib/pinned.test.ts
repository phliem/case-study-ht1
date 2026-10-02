import { describe, expect, it } from "vitest";
import type { PinnedLayer } from "../data/types";
import { pinnedStateIndex, pinnedTop } from "./pinned";

const BAR: PinnedLayer = {
  id: "breadcrumbs",
  x: 0,
  y: 400,
  width: 1440,
  stickTop: 67,
  releaseAt: 3000,
  states: [{ from: 0, src: "bar.png", height: 46, blur: null }],
};

const CONTENTS: PinnedLayer = {
  id: "contents",
  x: 1100,
  y: 500,
  width: 250,
  stickTop: 120,
  releaseAt: 2400,
  states: [
    { from: 0, src: "contents-0.png", height: 300, blur: null },
    { from: 900, src: "contents-1.png", height: 300, blur: null },
    { from: 1500, src: "contents-2.png", height: 320, blur: null },
  ],
};

describe("pinnedTop", () => {
  it("leaves a layer where it sits until the page scrolls it up to its sticking point", () => {
    expect(pinnedTop(BAR, 0)).toBe(400);
    expect(pinnedTop(BAR, 333)).toBe(400);
  });

  it("holds a stuck layer at its offset from the top of the frame", () => {
    expect(pinnedTop(BAR, 334)).toBe(401);
    expect(pinnedTop(BAR, 1200) - 1200).toBe(67);
  });

  it("lets a layer go when its container ends", () => {
    expect(pinnedTop(BAR, 2887)).toBe(2954);
    expect(pinnedTop(BAR, 2900)).toBe(2954);
    expect(pinnedTop(BAR, 4000)).toBe(2954);
  });

  it("uses the height of the state showing", () => {
    expect(pinnedTop(CONTENTS, 2300)).toBe(2080);
  });

  it("never lifts a layer above where it sits, even in a short container", () => {
    expect(pinnedTop({ ...BAR, releaseAt: 420 }, 1000)).toBe(400);
  });

  it("keeps a header at the top of the frame for the whole page", () => {
    const header: PinnedLayer = {
      id: "header",
      x: 0,
      y: 0,
      width: 1440,
      stickTop: 0,
      releaseAt: 3772,
      states: [
        { from: 0, src: "top.png", height: 67, blur: null },
        { from: 1, src: "scrolled.png", height: 67, blur: 10 },
      ],
    };
    for (const scroll of [0, 1, 500, 2872]) expect(pinnedTop(header, scroll)).toBe(scroll);
  });
});

describe("pinnedStateIndex", () => {
  it("shows each state from its start until the next one begins", () => {
    expect(pinnedStateIndex(CONTENTS, 0)).toBe(0);
    expect(pinnedStateIndex(CONTENTS, 899)).toBe(0);
    expect(pinnedStateIndex(CONTENTS, 900)).toBe(1);
    expect(pinnedStateIndex(CONTENTS, 1499)).toBe(1);
    expect(pinnedStateIndex(CONTENTS, 1500)).toBe(2);
    expect(pinnedStateIndex(CONTENTS, 9000)).toBe(2);
  });
});
