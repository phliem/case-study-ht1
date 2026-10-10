import { expect, type Page, test } from "@playwright/test";
import { REGISTRATION_FLOW } from "../src/journeys/registrationFlow";

const card = (page: Page, id: string) => page.locator(`[data-screen="${id}"] [data-dimmed]`);
const zoomLevel = (page: Page) => page.getByTestId("zoom-level");

test("shows every screen with its fonts and nothing from outside", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "").origin;
  const outside: string[] = [];
  const errors: string[] = [];
  await page.route(
    (url) => url.origin !== origin,
    (route) => {
      outside.push(route.request().url());
      return route.abort();
    },
  );
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/journeys/");

  await expect(page).toHaveTitle("Journeys · Bookable redesign");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bookable · User journeys");
  const titled = REGISTRATION_FLOW.screens.filter((screen) => screen.title);
  for (const screen of titled) {
    await expect(
      page.getByRole("heading", { level: 2, name: screen.title, exact: true }),
    ).toBeVisible();
  }
  const families = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => face.family.replaceAll('"', ""));
  });
  expect(new Set(families)).toEqual(
    new Set(["Newsreader Variable", "Public Sans", "JetBrains Mono"]),
  );
  await page.waitForLoadState("networkidle");
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

test("traces every route to a screen while it is hovered", async ({ page }) => {
  await page.goto("/journeys/");
  await page.locator('[data-screen="health"]').hover();
  await expect(card(page, "abroad")).toHaveAttribute("data-dimmed", "false");
  await expect(card(page, "prevgp")).toHaveAttribute("data-dimmed", "false");
  await expect(card(page, "outside")).toHaveAttribute("data-dimmed", "true");
  await expect(card(page, "review")).toHaveAttribute("data-dimmed", "true");

  await page.mouse.move(5, 400);
  await expect(card(page, "outside")).toHaveAttribute("data-dimmed", "false");
});

test("plays a journey a screen at a time", async ({ page }) => {
  await page.goto("/journeys/");
  await page.getByRole("button", { name: "Select your journey" }).click();
  await page.getByRole("button", { name: "Arriving from abroad" }).click();

  await expect(page.getByText("Step 1 of 8")).toBeVisible();
  await expect(card(page, "practice")).toHaveAttribute("data-dimmed", "false");
  await expect(card(page, "postcode")).toHaveAttribute("data-dimmed", "true");
  await expect(page.getByText("Step 2 of 8")).toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByText("Step 3 of 8")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Step 5 of 8")).toBeVisible();
  await expect(card(page, "abroad")).toHaveAttribute("data-dimmed", "false");
  await expect(card(page, "prevgp")).toHaveAttribute("data-dimmed", "true");

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: "Select your journey" })).toBeVisible();
  await expect(card(page, "prevgp")).toHaveAttribute("data-dimmed", "false");
});

test("zooms around the middle and fits the board back on screen", async ({ page }) => {
  await page.goto("/journeys/");
  await expect(zoomLevel(page)).toHaveText("55%");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(zoomLevel(page)).toHaveText("66%");
  await page.getByRole("button", { name: "Zoom out" }).click();
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(zoomLevel(page)).toHaveText("46%");
  await page.getByRole("button", { name: "Fit" }).click();
  await expect(zoomLevel(page)).toHaveText("55%");
});

test("pans by dragging and scrolling, and zooms with Ctrl and scroll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/journeys/");
  const practice = page.locator('[data-screen="practice"]');
  const start = await practice.boundingBox();

  await page.mouse.move(700, 500);
  await page.mouse.down();
  await page.mouse.move(600, 450, { steps: 5 });
  await page.mouse.up();
  const dragged = await practice.boundingBox();
  expect(dragged?.x).toBeCloseTo((start?.x ?? 0) - 100, 0);
  expect(dragged?.y).toBeCloseTo((start?.y ?? 0) - 50, 0);

  await page.mouse.wheel(0, 120);
  await expect
    .poll(async () => (await practice.boundingBox())?.y)
    .toBeCloseTo((dragged?.y ?? 0) - 120, 0);

  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -100);
  await page.keyboard.up("Control");
  await expect(zoomLevel(page)).toHaveText("148%");
});

test("opens the help on its own, and closes it on request", async ({ page }) => {
  await page.goto("/journeys/");
  const help = page.getByRole("button", { name: "How to explore" });
  await expect(help).toHaveAttribute("aria-expanded", "false");
  await expect(help).toHaveAttribute("aria-expanded", "true", { timeout: 5000 });
  await help.click();
  await expect(help).toHaveAttribute("aria-expanded", "false");
});

test("keeps the help whole and on screen on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/journeys/");
  const help = page.getByRole("button", { name: "How to explore" });
  await help.click();
  await expect.poll(async () => (await help.boundingBox())?.width).toBe(350);
  await expect
    .poll(() => help.evaluate((element) => element.scrollHeight - element.clientHeight))
    .toBe(0);
});
