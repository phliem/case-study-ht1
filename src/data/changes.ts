import type { PageId, SectionId, SectionIdOf } from "./types";

type PageChanges = { [P in PageId]: Record<SectionIdOf[P], readonly string[]> };

export const CHANGES: PageChanges = {
  home: {
    hero: [
      "The postcode search becomes the hero's single control, lifted further here than anywhere else it appears.",
      "A reel of appointment cards scrolls beside the search on desktop.",
      "The header lies clear over the hero and turns solid as soon as the page moves.",
    ],
    proof: [
      "Stats, a top-rated surgeries list and reviews, three NHS-styled blocks, merge into one testimonials section.",
      "Headline figures sit under the quotes they back up.",
    ],
    how: [
      "Icons give way to looping product vignettes for each step.",
      "Steps are numbered with tracked microlabels: Step 1, Step 2, Step 3.",
    ],
    "faq-about": [
      "The FAQ moves above About.",
      'Its title changes from "Common questions about finding an NHS GP in England" to "Questions before you start".',
    ],
    areas: [
      'The "Looking for a GP in a specific city?" tag list becomes a call to action: "Find an NHS GP surgery in your area".',
      "The areas where Bookable is live sit underneath, ready to browse.",
    ],
    footer: [
      "The NHS three-column footer becomes one site-wide footer: brand, inline nav, the 111/999 disclaimer and legal links.",
      "On phones the nav becomes 56px full-width rows and the legal links a two-column grid.",
    ],
  },
  article: {
    title: [
      "A bare NHS heading becomes a hero that names the category, Booking care, with a 4 min read time and when the guide was last reviewed.",
      "Breadcrumbs sit under the hero, then pin beneath the header as you read.",
    ],
    guide: [
      'Two headed sections grow into six, opened by an "In short" summary of three points.',
      'On desktop an "On this page" list follows you down the article and marks the section you are in.',
    ],
    questions: [
      "New in v2: four common questions answered on the page, each in its own card.",
      "The how-to page had no questions, so the before side waits here while they scroll past.",
    ],
    next: [
      'A lone "Find a new GP surgery near you" button becomes a "Ready when you are" card with the postcode search inside it.',
      "A row of related articles below carries the reader on.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  help: {
    title: [
      'A plain "Frequently asked questions" heading over a list of links becomes a search-first hero: "How can we help?"',
      "The search filters every answer as you type.",
    ],
    questions: [
      "48 questions in eleven expanding sections give way to a short list of popular questions and a grid of topics.",
      "Each topic gets its own page, so an answer has an address worth sharing.",
    ],
    "more-help": [
      '"Need more help?" and its three bullet points become "Still need help?", a row of three cards.',
      "The cards go straight to Call 111, nhs.uk and Call 999.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  search: {
    title: [
      "Search used to find GP surgeries only. A GP surgeries / Clinicians switch now sits beside Filters and Sort, so patients can search by surgery or by the clinician they want to see.",
      "The postcode box in the header and the row of filter chips give way to a bar with the reason for the appointment and the location, and either can be changed from there.",
      'The heading counts surgeries, not appointments: "26 GP surgeries near you", near IG1 2UT within 5 miles.',
    ],
    results: [
      "A long list of links beside a map that stayed in view becomes a map above pages of v2 cards.",
      "Each card says what you can do there: Book appointment, Register with this GP surgery or View GP surgery details. Walking and driving times give way to rating and distance chips.",
    ],
    about: [
      'New since January: an "About finding an NHS GP in England" panel under the results.',
      "The January page had none, so the before side waits here while it scrolls past.",
    ],
    footer: [
      "The January footer, a list of support links, becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  gp: {
    title: [
      "The NHS-blue banner becomes a v2 header: breadcrumbs back to the search, then the surgery's name, rating, distance and phone number.",
      'The inline "Book an appointment" box becomes a booking card with the earliest slot, Book appointment and Register without appointment. The calendar now opens in a dialog.',
      "The photo, map, address and opening hours move into a rail that stays in view on desktop.",
    ],
    reviews: [
      '"Ratings and reviews", with a bar for each star, becomes "What patients say": the score and the latest review.',
      'The Google and Bookable breakdowns give way to a single "Read reviews on Google" link.',
    ],
    team: [
      '"Meet the team" showed three people behind a See more link. "Care team" shows nine in a grid, with initials and roles.',
      "A bigger team folds behind Show more and Show fewer.",
    ],
    questions: [
      "New in v2: common questions about the surgery, answered on the page.",
      "The old page had none, so the before side waits here while they scroll past.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  clinician: {
    title: [
      "The NHS-blue banner becomes the GP surgery page's header: avatar, role, name and nearest surgery.",
      "The calendar on the page gives way to a booking card with the earliest time, Book appointment and Register without appointment.",
      "Booking opens the v2 booker, which asks where to go when the clinician works at more than one surgery.",
    ],
    details: [
      'New in v2: "Where they work", "How you can be seen" and "Languages spoken".',
      "They take over from the Directions box, which gave one address and a Google Maps link.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  carenav: {
    start: [
      'Both start on /choose, "What would you like to do?", with Book an appointment and Register with a GP surgery.',
      "Book an appointment used to open the first of three question pages. Now it opens the GP search with a care navigation window on top.",
    ],
    about: [
      "Date of birth and sex were two pages, each with its own Continue. They are now one step in the window.",
      'The window reads the date back as you type: "14 June 1990, age 36".',
    ],
    reason: [
      '"How can we help?" was a page of its own. In v2 the reason is step 2 of 2, with the answers so far underneath and Change to go back.',
      "Sending it asks for the right care for that reason, as Continue did before.",
    ],
    emergency: [
      'The "Call 999 now for any of these:" check stays, as a dialog over the window instead of a drawer over the page.',
      "I have none of these carries on to the results either way.",
    ],
    result: [
      "Both end on the GP search, filtered to the care that suits the reason given.",
      "In v2 the bar on top shows the reason, Cough, and Change reopens care navigation without leaving the results.",
    ],
  },
  booking: {
    patient: [
      'Both ask "Are you a new patient at John Smith Medical Centre?" first.',
      "Before, the question sat on the surgery page itself. Now it is step 1 of 3 in a booking window over the page.",
    ],
    time: [
      "The calendar on the page, with appointment type, day and time, becomes step 2: Choose your time, with the day behind a Change button.",
      'The window keeps the choice in view at the bottom, "Monday, 12 October · Morning", while you decide.',
    ],
    review: [
      "Before, Book appointment opened a Review drawer to confirm the date, time and clinician.",
      "v2 drops the step, because the window has shown the choice all along, so the after side has nothing here.",
    ],
    details: [
      "Contact details were a page of their own, with a timer for how long the time is held. They are now step 3 in the same window.",
      "The fields are the same: reason, name, date of birth, postcode, email and mobile, filled in here with fictional details.",
    ],
    verify: [
      "Both still check the mobile number with a six-digit code on a page of its own.",
      "The window hands over to it once the details are in.",
    ],
    confirmed: [
      'Both end on "Your booking is confirmed." with the appointment and the details given.',
      "These last two pages have not moved to v2 yet, so they look alike on either side.",
    ],
  },
};

export function changesFor(page: PageId, id: SectionId): readonly string[] {
  const notes: Partial<Record<SectionId, readonly string[]>> = CHANGES[page];
  const found = notes[id];
  if (!found) throw new Error(`There are no notes for ${id} on the ${page} page`);
  return found;
}
