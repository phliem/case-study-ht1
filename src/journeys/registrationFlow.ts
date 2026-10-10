import type { Flow } from "./flow";

export const REGISTRATION_FLOW: Flow = {
  screens: [
    {
      id: "practice",
      column: 0,
      title: "Practice profile",
      description: "The patient finds their surgery on Bookable and taps Register.",
    },
    {
      id: "postcode",
      column: 1,
      title: "Check your postcode",
      description: "We check the address is inside the practice catchment area.",
    },
    {
      id: "about",
      column: 2,
      title: "About you",
      description: "Name, date of birth, sex, and NHS number if known.",
    },
    {
      id: "contact",
      column: 3,
      title: "Contact details",
      description: "Address, phone and email so the practice can get in touch.",
    },
    {
      id: "prevgp",
      column: 4,
      title: "Previous GP",
      description: "Previous practice and address so records can transfer.",
    },
    {
      id: "health",
      column: 5,
      title: "Health questions",
      description: "Medicines, allergies, conditions, smoking and alcohol.",
    },
    {
      id: "review",
      column: 6,
      title: "Review and consent",
      description: "The patient checks answers and chooses Summary Care Record sharing.",
    },
    { id: "done", column: 7, title: "", description: "", end: true },
    {
      id: "outside",
      column: 2,
      branch: true,
      title: "Outside catchment",
      description: "The practice cannot accept this address. We explain why.",
    },
    {
      id: "nearby",
      column: 3,
      branch: true,
      title: "Nearby practices",
      description: "The patient sees practices that cover their postcode.",
      end: true,
    },
    {
      id: "abroad",
      column: 4,
      branch: true,
      title: "Arriving in the UK",
      description: "Date of arrival and any previous UK address.",
    },
  ],
  edges: [
    { from: "practice", to: "postcode", label: "Taps Register" },
    { from: "postcode", to: "about", label: "In catchment" },
    { from: "postcode", to: "outside", label: "Outside catchment" },
    { from: "outside", to: "nearby", label: "Taps See nearby" },
    { from: "about", to: "contact", label: "Taps Continue" },
    { from: "contact", to: "prevgp", label: "Moving within the UK" },
    { from: "contact", to: "abroad", label: "Moving from abroad" },
    { from: "prevgp", to: "health", label: "Taps Continue" },
    { from: "abroad", to: "health", label: "Taps Continue" },
    { from: "health", to: "review", label: "Taps Continue" },
    { from: "review", to: "done", label: "Taps Submit" },
  ],
  journeys: [
    {
      id: "uk",
      label: "Moving within the UK",
      path: ["practice", "postcode", "about", "contact", "prevgp", "health", "review", "done"],
    },
    {
      id: "abroad",
      label: "Arriving from abroad",
      path: ["practice", "postcode", "about", "contact", "abroad", "health", "review", "done"],
    },
    {
      id: "outside",
      label: "Outside catchment",
      path: ["practice", "postcode", "outside", "nearby"],
    },
  ],
};
