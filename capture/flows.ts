import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import type { FlowPageId, PageId } from "../src/data/types";
import { type ApiFixture, fixtureDir } from "./apiFixtures";
import type { BuildName } from "./builds";
import type { FlowContext, FlowScript } from "./flowShoot";

type FlowSide = { build: BuildName; script: FlowScript };

const PATIENT = {
  firstName: "Alex",
  lastName: "Taylor",
  day: "14",
  month: "6",
  year: "1990",
  phone: "07700 900123",
  email: "alex.taylor@example.com",
  postcode: "IG1 2UT",
  reason: "I've had a cough and chest tightness for three weeks and it isn't getting better.",
  code: "123456",
};

const BOOKING_ID = "boo_casestudydemo1";
const CARE_NAVIGATION_ID = "cna_casestudydemo1";
const SURGERY_PATH = "/gp/john-smith-medical-centre-loc_9a5qmmkpexdu";
const SURGERY = `${SURGERY_PATH}?postcode=IG1%202UT`;
const CHOOSE = "/choose?postcode=IG1%202UT";

type Appointment = { id: string; [key: string]: unknown };
type LocationWithAppointments = { appointments?: Appointment[]; [key: string]: unknown };

function fixtureJson(page: PageId): unknown[] {
  return readdirSync(fixtureDir(page))
    .filter((file) => file.endsWith(".json") && file !== "clock.json")
    .map((file) => JSON.parse(readFileSync(join(fixtureDir(page), file), "utf8")) as ApiFixture)
    .flatMap((fixture) => ("json" in fixture.body ? [fixture.body.json] : []));
}

// The hold, contact details and status pages read the held appointment back by booking id. That
// answer is put together from the recorded search for the surgery, so it names a real slot.
function heldAppointment(page: PageId, appointmentId: string) {
  for (const body of fixtureJson(page)) {
    const locations = (body as { locations?: LocationWithAppointments[] }).locations ?? [];
    for (const { appointments = [], ...location } of locations) {
      const appointment = appointments.find((each) => each.id === appointmentId);
      if (appointment) return { ...appointment, location };
    }
  }
  throw new Error(`No recorded appointment has the id ${appointmentId}`);
}

function searchResults(): unknown {
  const body = fixtureJson("search").find(
    (json) =>
      Array.isArray((json as { locations?: unknown }).locations) &&
      "recommended" in (json as object),
  );
  if (!body) throw new Error("The GP search fixtures hold no location summaries");
  return body;
}

function bookingDetails(state: string) {
  return {
    id: BOOKING_ID,
    reasonForBooking: PATIENT.reason,
    state,
    firstName: PATIENT.firstName,
    lastName: PATIENT.lastName,
    email: PATIENT.email,
    phoneNumber: "+447700900123",
    registeredLocationIds: [],
    postcode: PATIENT.postcode,
    bookingType: "new-patient",
  };
}

function careNavigation() {
  return {
    id: CARE_NAVIGATION_ID,
    request: PATIENT.reason,
    dateOfBirth: "1990-06-14T00:00:00.000Z",
    sexAtBirth: "female",
    patientConfirmedCategory: null,
    category: "Cough",
    sessionId: "00000000-0000-4000-8000-000000000001",
  };
}

async function visible(page: Page, name: string | RegExp) {
  const button = page.getByRole("button", { name }).or(page.getByRole("link", { name }));
  return button.filter({ visible: true }).first();
}

async function click(page: Page, name: string | RegExp) {
  await (await visible(page, name)).click();
}

async function fillDateOfBirth(page: Page) {
  await page.getByLabel("Day", { exact: true }).filter({ visible: true }).first().fill(PATIENT.day);
  const month = page.getByLabel("Month", { exact: true }).filter({ visible: true }).first();
  if ((await month.evaluate((element) => element.tagName)) === "SELECT") {
    await month.selectOption(PATIENT.month);
  } else {
    await month.fill(PATIENT.month);
  }
  await page
    .getByLabel("Year", { exact: true })
    .filter({ visible: true })
    .first()
    .fill(PATIENT.year);
}

async function scrollToTop(page: Page, target: Locator) {
  const top = await target.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    Math.max(0, top - 100),
  );
}

async function stubBooking(flow: FlowContext) {
  let appointmentId = "";
  const timeoutAt = new Date(flow.now.getTime() + 10 * 60_000).toISOString();
  await flow.stub("POST", /^\/v2\/bookings$/, (request) => {
    appointmentId = (request.postDataJSON() as { appointmentId: string }).appointmentId;
    return { status: 201, json: { id: BOOKING_ID, timeoutAt } };
  });
  await flow.stub("POST", new RegExp(`^/v2/bookings/${BOOKING_ID}/extend$`), () => ({
    json: { id: BOOKING_ID, timeoutAt },
  }));
  await flow.stub("GET", new RegExp(`^/v2/appointments/${BOOKING_ID}(\\?|$)`), () => ({
    json: heldAppointment("booking", appointmentId),
  }));
  await flow.stub("GET", new RegExp(`^/v2/appointments/${BOOKING_ID}/register_link`), () => ({
    json: { odsCode: "F00000", link: "https://bookable.health/", kind: "reg_form" },
  }));
  await flow.stub("PATCH", new RegExp(`^/v2/bookings/${BOOKING_ID}$`), () => ({
    json: { id: BOOKING_ID, reasonForBooking: PATIENT.reason, state: "pending-authentication" },
  }));
  await flow.stub("GET", new RegExp(`^/v2/bookings/${BOOKING_ID}(\\?|$)`), () => ({
    json: bookingDetails("pending-authentication"),
  }));
}

// January shows the code check and the confirmation as pages (on /booking-status/<id> itself);
// today the code check is a step in the booking window. Each is captioned by where it appears.
type Counter = { step: number; page: number };

function where(page: Page, counter: Counter): Promise<string> {
  return page
    .getByRole("dialog")
    .isVisible()
    .then((inWindow) =>
      inWindow
        ? `Step ${counter.step++} · Booking window over bookable.health${SURGERY_PATH}`
        : `Page ${counter.page++} · bookable.health${new URL(page.url()).pathname}`,
    );
}

async function verifyAndConfirm(flow: FlowContext, counter: Counter) {
  const { page } = flow;
  await page
    .getByText(/^(Verification code|Check your phone or email)$/)
    .first()
    .waitFor({ timeout: 30_000 });
  const scope = (await page.getByRole("dialog").isVisible()) ? page.getByRole("dialog") : page;
  await scope.locator("input").filter({ visible: true }).first().click();
  await page.keyboard.type(PATIENT.code);
  await flow.shot("verify", await where(page, counter));
  await flow.stub("POST", new RegExp(`^/v2/bookings/${BOOKING_ID}/authenticate$`), () => ({
    json: { id: BOOKING_ID, reasonForBooking: PATIENT.reason, state: "booked" },
  }));
  await flow.stub("GET", new RegExp(`^/v2/bookings/${BOOKING_ID}(\\?|$)`), () => ({
    json: bookingDetails("booked"),
  }));
  await scope
    .getByRole("button", { name: /^(Verify|Continue)$/ })
    .filter({ visible: true })
    .first()
    .click();
  // Today's window hands over to the booking's status page once the code is accepted; in a
  // scripted run it can stay on "Finding your NHS record", so the capture opens that page itself.
  const handedOver = await page
    .waitForURL(/\/booking-status\//, { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (!handedOver) {
    await page.goto(`${flow.base}/booking-status/${BOOKING_ID}?postcode=IG12UT&service=medical`);
  }
  await page
    .getByText(/booking is confirmed|you're booked|appointment is booked|Manage your appointment/i)
    .first()
    .waitFor({ timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await flow.shot("confirmed", await where(page, counter));
}

const bookingBefore: FlowScript = async (flow) => {
  const { page, base } = flow;
  const at = (n: number, path: string) => `Page ${n} · bookable.health${path}`;
  await stubBooking(flow);
  await page.goto(`${base}${SURGERY}`, { waitUntil: "networkidle" });
  await scrollToTop(page, page.getByText("Book an appointment", { exact: true }).first());
  await flow.shot("time", at(1, SURGERY_PATH));
  await page
    .getByRole("button", { name: /^Book$/ })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByText("Confirm and continue").first().waitFor();
  await flow.shot("review", at(1, `${SURGERY_PATH} · Appointment details drawer`));
  await click(page, "Confirm and continue");
  await page.waitForURL(/\/appointment\//);
  await page.waitForLoadState("networkidle");
  await page.getByText("Your appointment is reserved").waitFor();
  await page.waitForTimeout(1000);
  await page.locator('input[name="firstName"]').fill(PATIENT.firstName);
  await page.locator('input[name="lastName"]').fill(PATIENT.lastName);
  await page.locator('input[name="phoneNumber"]').fill(PATIENT.phone);
  await page.locator('input[name="email"]').fill(PATIENT.email);
  await page.locator('input[name="postcode"]').fill(PATIENT.postcode);
  if ((await page.getByLabel("Day", { exact: true }).count()) > 0) await fillDateOfBirth(page);
  const reason = page.locator("textarea").filter({ visible: true }).first();
  await reason.click();
  await reason.pressSequentially(PATIENT.reason);
  await reason.blur();
  await flow.shot("details", at(2, `/appointment/${BOOKING_ID}`), { fullPage: true });
  await click(page, /Continue to register|Confirm appointment details|Continue/);
  await verifyAndConfirm(flow, { step: 1, page: 3 });
};

const bookingAfter: FlowScript = async (flow) => {
  const { page, base } = flow;
  const window = (n: number) => `Step ${n} · Booking window over bookable.health${SURGERY_PATH}`;
  await stubBooking(flow);
  await page.goto(`${base}${SURGERY}`, { waitUntil: "networkidle" });
  await click(page, "Book appointment");
  const dialog = page.getByRole("dialog");
  await dialog.getByText(/Are you a new patient/).waitFor();
  await dialog.getByText("Yes", { exact: true }).click();
  await flow.shot("patient", window(1));
  await dialog.getByRole("button", { name: "Continue" }).click();
  let step = 2;
  const seen = dialog.getByText("How would you like to be seen?");
  const pick = dialog.getByText("Choose your time");
  await seen.or(pick).first().waitFor();
  if (await seen.isVisible()) {
    await dialog.getByText("Telephone", { exact: true }).click();
    await flow.shot("time", window(step++));
    await dialog.getByRole("button", { name: "Continue" }).click();
    await pick.waitFor();
  }
  const slot = dialog.locator('[data-testid^="time-slot-"]').first();
  if ((await slot.getAttribute("aria-pressed")) !== "true") await slot.click();
  await flow.shot("time", window(step++));
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByText("Confirm your details below").waitFor();
  const reason = dialog.locator("#booker-reason");
  if (await reason.isVisible()) await reason.fill(PATIENT.reason);
  await dialog.locator("#register-first-name").fill(PATIENT.firstName);
  await dialog.locator("#register-last-name").fill(PATIENT.lastName);
  if (await dialog.locator("#register-dob-day").isVisible()) {
    await dialog.locator("#register-dob-day").fill(PATIENT.day);
    const month = dialog.locator("#register-dob-month");
    if ((await month.evaluate((element) => element.tagName)) === "SELECT") {
      await month.selectOption(PATIENT.month);
    } else {
      await month.fill(PATIENT.month);
    }
    await dialog.locator("#register-dob-year").fill(PATIENT.year);
  }
  await dialog.locator("#booker-postcode").fill(PATIENT.postcode);
  await dialog.locator("#booker-email").fill(PATIENT.email);
  await dialog.locator("#booker-phone").fill(PATIENT.phone);
  await flow.shot("details", window(step));
  await dialog.evaluate((element) => {
    for (const each of element.querySelectorAll("*")) {
      if (
        each.scrollHeight > each.clientHeight + 8 &&
        getComputedStyle(each).overflowY !== "visible"
      ) {
        each.scrollTop = each.scrollHeight;
      }
    }
  });
  await flow.shot("details", window(step++));
  await dialog.getByRole("button", { name: "Continue" }).click();
  await verifyAndConfirm(flow, { step, page: 2 });
};

async function stubCareNavigation(flow: FlowContext) {
  await flow.stub("POST", /^\/v2\/care_navigations$/, () => ({
    status: 201,
    json: careNavigation(),
  }));
  await flow.stub("GET", new RegExp(`^/v2/care_navigations/${CARE_NAVIGATION_ID}(\\?|$)`), () => ({
    json: careNavigation(),
  }));
  await flow.stub("POST", /^\/v2\/care_navigations\/[^/]+\/disposition_assessments$/, () => ({
    json: { outcome: "ineligible", questions: [], careNavigationDispositionId: null },
  }));
  await flow.stub("POST", /^\/v2\/care_navigations\/[^/]+\/user_events$/, () => ({ status: 204 }));
  await flow.stub("POST", /^\/v2\/appointments\/available_pathways$/, () => ({
    json: { pathways: ["GP"] },
  }));
  await flow.stub("GET", /^\/v2\/appointments\/location_summaries/, () => ({
    json: searchResults(),
  }));
}

// January's postcode box suggests places through Google Places, which the build has no key for, so
// the one suggestion and its location are stubbed with IG1 2UT.
async function stubGooglePlaces(page: Page) {
  const json = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });
  await page
    .context()
    .route(/^https:\/\/places\.googleapis\.com\/v1\/places:autocomplete/, (route) =>
      route.fulfill(
        json({
          suggestions: [
            {
              placePrediction: {
                placeId: "casestudy-ig1-2ut",
                text: { text: "Ilford IG1 2UT, UK" },
                types: ["postal_code"],
              },
            },
          ],
        }),
      ),
    );
  await page.context().route(/^https:\/\/places\.googleapis\.com\/v1\/places\/casestudy/, (route) =>
    route.fulfill(
      json({
        location: { latitude: 51.54968, longitude: 0.087149 },
        postalAddress: { postalCode: PATIENT.postcode, addressLines: [] },
      }),
    ),
  );
}

const carenavBefore: FlowScript = async (flow) => {
  const { page, base } = flow;
  const at = (n: number, path: string) => `Page ${n} · bookable.health${path}`;
  await stubCareNavigation(flow);
  await stubGooglePlaces(page);
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByText("Postcode, street or location name").first().click();
  await page.locator("#location").filter({ visible: true }).pressSequentially(PATIENT.postcode);
  await page
    .locator("[data-vaul-drawer] button")
    .filter({ hasText: PATIENT.postcode })
    .first()
    .click();
  await page.locator("[data-vaul-drawer]").waitFor({ state: "detached" });
  await flow.shot("start", at(1, ""));
  await page
    .getByRole("button", { name: "Search", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.waitForURL(/date-of-birth/);
  await fillDateOfBirth(page);
  await flow.shot("about", at(2, "/care-navigation/date-of-birth"));
  await click(page, "Continue");
  await page.waitForURL(/sex-at-birth/);
  await page.getByText("Female", { exact: true }).click();
  await flow.shot("about", at(3, "/care-navigation/sex-at-birth"));
  await click(page, "Continue");
  await page.waitForURL(/description/);
  await page
    .locator("textarea")
    .filter({ visible: true })
    .first()
    .pressSequentially(PATIENT.reason);
  await flow.shot("reason", at(4, "/care-navigation/description"));
  await click(page, "Find an appointment");
  await page.waitForURL(/emergency-check/);
  await page.waitForLoadState("networkidle");
  await flow.shot("emergency", at(5, "/care-navigation/emergency-check"));
  await click(page, /none of these/i);
  await page.waitForURL(/\/gp\/search/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await flow.shot("result", at(6, "/gp/search"));
};

const carenavAfter: FlowScript = async (flow) => {
  const { page, base } = flow;
  const window = (n: number) => `Step ${n} · Care navigation window over bookable.health/gp/search`;
  await stubCareNavigation(flow);
  await page.goto(`${base}${CHOOSE}`, { waitUntil: "networkidle" });
  await flow.shot("start", "Page 1 · bookable.health/choose");
  await click(page, /Book an appointment|Find an appointment/);
  const dialog = page.getByRole("dialog");
  await dialog.getByText(/Enter your details/).waitFor();
  await fillDateOfBirth(page);
  await dialog.getByText("Female", { exact: true }).click();
  await flow.shot("about", window(1));
  await click(page, "Continue");
  const reason = page.getByLabel("Reason for your appointment").filter({ visible: true }).first();
  await reason.waitFor();
  await reason.fill(PATIENT.reason);
  await flow.shot("reason", window(2));
  await click(page, "Find the right care");
  await page.getByText("Call 999 now for any of these:").first().waitFor();
  await flow.shot("emergency", window(3));
  await click(page, "I have none of these");
  await page.waitForURL(/pathway=GP/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await flow.shot("result", "Page 2 · bookable.health/gp/search");
};

export const FLOW_SOURCES: Record<FlowPageId, { before: FlowSide; after: FlowSide }> = {
  booking: {
    before: { build: "january", script: bookingBefore },
    after: { build: "latest", script: bookingAfter },
  },
  carenav: {
    before: { build: "january", script: carenavBefore },
    after: { build: "latest", script: carenavAfter },
  },
};
