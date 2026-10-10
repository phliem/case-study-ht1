import type { PageId, SectionId, SectionIdOf } from "./types";

type PageChanges = { [P in PageId]: Record<SectionIdOf[P], readonly string[]> };

export const CHANGES: PageChanges = {
  home: {
    hero: [
      '"Get an appointment with a new GP surgery this week." becomes "Register and book with an NHS GP".',
      "The postcode box that opened a drawer and its separate Search button become one search pill, with a reel of appointment cards beside it on desktop.",
      "The header lies clear over the hero and turns solid as soon as the page moves.",
    ],
    proof: [
      "Testimonials now come before the steps, as their own section with headline figures under the quotes.",
      "January's five short reviews sat under How it works, so the before side waits here while this scrolls past.",
    ],
    how: [
      'January\'s "How it works" listed three steps with a line of text each. "How to register and book with an NHS GP" shows each step as a looping product vignette.',
      "On the left, January's five reviews follow the steps.",
    ],
    "faq-about": [
      'Seven question links and "See all frequently asked questions" become "Questions about registering with a GP", answered in place.',
      'An "About finding an NHS GP in England" section follows.',
    ],
    areas: [
      'New since January: "Find an NHS GP surgery in your area", with the areas where Bookable is live, ready to browse.',
      "January ended on the questions, so the before side waits here.",
    ],
    footer: [
      'January\'s footer, a grey row of links signed "Made with love in Stratford", becomes the site-wide footer: brand, nav, the 111/999 disclaimer and legal links.',
      "On phones the nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  article: {
    title: [
      "A bare NHS heading becomes a hero that names the category, Booking care, with a read time and when the guide was last reviewed.",
      "The guide moves from /how-to/book-doctor-appointment-nhs to /articles/book-a-gp-appointment, with breadcrumbs that pin beneath the header as you read.",
    ],
    guide: [
      '"What sort of care do you need?" and "How to book a GP Appointment?" grow into a guide of six sections.',
      'On desktop an "On this page" list follows you down the article and marks the section you are in.',
    ],
    questions: [
      "New since January: common questions answered on the page, each in its own card.",
      "The how-to page had none, so the before side waits here while they scroll past.",
    ],
    next: [
      'A count of appointments and a lone "Find a new GP surgery near you" button become a "Ready when you are" card with the postcode search inside it.',
      "A row of related articles below carries the reader on.",
    ],
    footer: [
      'January\'s footer, a grey row of links signed "Made with love in Stratford", becomes the site-wide footer: brand, nav, the 111/999 disclaimer and legal links.',
      "On phones the nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  help: {
    title: [
      'A plain "Frequently asked questions" heading over a contents list becomes a search-first hero: "How can we help?"',
      "The search filters every answer as you type.",
    ],
    questions: [
      "Eleven expanding sections of questions give way to a short list of popular questions and a grid of topics.",
      "Each topic gets its own page, so an answer has an address worth sharing.",
    ],
    "more-help": [
      '"Need more help?" and its bullet points become "Still need help?", a row of three cards.',
      "The cards go straight to Call 111, nhs.uk and Call 999.",
    ],
    footer: [
      'January\'s footer, a grey row of links signed "Made with love in Stratford", becomes the site-wide footer: brand, nav, the 111/999 disclaimer and legal links.',
      "On phones the nav becomes full-width rows and the legal links a two-column grid.",
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
      'January\'s footer, a grey row of links signed "Made with love in Stratford", becomes the site-wide footer: brand, nav, the 111/999 disclaimer and legal links.',
      "On phones the nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  gp: {
    title: [
      "January's stack of NHS cards (a thumbnail photo, then a score box with the rating and total appointments) becomes a v2 header: breadcrumbs, the surgery's name, rating, distance and phone number.",
      "A booking card says when nothing is free and keeps Register without appointment next to Book appointment. The calendar, and the Book bar January docked to the window, move into the booking window.",
      "The photo, map, address and opening hours move into a rail that stays in view on desktop, with today's hours highlighted.",
    ],
    nearby: [
      'New since January: "Other GP surgeries nearby" lists three surgeries with how many appointments each has, their rating and distance, and links to every surgery near London.',
      "January had nothing like it, so the before side waits here while it scrolls past.",
    ],
    team: [
      '"Meet the team" counted 36 people and showed three, with photos, languages and a role badge, behind a See more link. "Care team" shows nine GPs with their photos in a grid.',
      "A bigger team folds behind Show more. Facilities and access, with the CQC rating, follow, also new since January.",
    ],
    questions: [
      "New since January: common questions about the surgery, answered on the page.",
      "The January page had none, so the before side waits here while they scroll past.",
    ],
    footer: [
      'January\'s footer, a grey row of links signed "Made with love in Stratford", becomes the site-wide footer: brand, nav, the 111/999 disclaimer and legal links.',
      "On phones the nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  clinician: {
    title: [
      "Clinician pages did not exist in January; the left side is the first version, from September, with an NHS-blue banner and a calendar straight on the page.",
      "Today it has the GP surgery page's header (avatar, role, name and nearest surgery) and a booking card with the earliest time.",
      "Booking opens the same window as a surgery, which asks where to go when the clinician works at more than one surgery.",
    ],
    details: [
      'New since the first version: "Where they work", "How you can be seen" and "Languages spoken".',
      "They take over from the Directions box, which gave one address and a Google Maps link.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  carenav: {
    start: [
      "Today Book an appointment on /choose opens the GP search with a care navigation window on top.",
      "In January the questions came after a postcode search on the homepage, so the before side waits on its first question page.",
    ],
    about: [
      "Date of birth and sex were pages 1 and 2 of 4, each with its own Continue. They are now one step in the window.",
      'The window reads the date back as you type: "14 June 1990, age 36".',
    ],
    reason: [
      '"How can we help?" was page 3 of 4, sent with Find an appointment. In v2 the reason is step 2 of 2, with the answers so far underneath and Change to go back.',
      "Sending it asks for the right care for that reason, as before.",
    ],
    emergency: [
      '"Check it\'s not an emergency" was page 4 of 4. It is now a dialog over the window: "Call 999 now for any of these:".',
      "I have none of these carries on to the results either way.",
    ],
    result: [
      "Both end on the GP search, filtered to the care that suits the reason given.",
      "Today the bar on top shows the reason, Cough, and Change reopens care navigation without leaving the results.",
    ],
  },
  booking: {
    patient: [
      'New since January: the window first asks "Are you a new patient at John Smith Medical Centre?"',
      "January went straight to the calendar, so the before side waits here.",
    ],
    time: [
      "January's calendar sat on the surgery page, with the chosen time in a Book bar docked to the bottom of the window.",
      "It becomes step 2 of the window, Choose your time, with the choice kept in view at the bottom while you decide.",
    ],
    review: [
      "In January, Book opened an Appointment details drawer to confirm the surgery, clinician, date and time.",
      "Today's window has shown the choice all along, so the after side has nothing here.",
    ],
    details: [
      '"Confirm appointment" was a page of its own (1 of 3) with a timer for how long the time is held. It is now step 3 in the same window.',
      "The fields are the same: reason, name, date of birth, postcode, email and mobile, filled in here with fictional details.",
    ],
    verify: [
      "The six-digit code was a page of its own in January.",
      'Today it is step 4 of the window: "Check your phone or email".',
    ],
    confirmed: [
      'January ended on "Manage your appointment", with the green "Your booking is confirmed." panel under the appointment and your details.',
      'Today it ends on a status card: a tick and "Your booking is confirmed" first, then how, when, with whom and where.',
    ],
  },
};

export function changesFor(page: PageId, id: SectionId): readonly string[] {
  const notes: Partial<Record<SectionId, readonly string[]>> = CHANGES[page];
  const found = notes[id];
  if (!found) throw new Error(`There are no notes for ${id} on the ${page} page`);
  return found;
}
