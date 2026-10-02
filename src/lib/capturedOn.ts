const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

export function capturedOn(timestamps: readonly string[]): string {
  if (timestamps.length === 0) throw new Error("There are no captures to date");
  const times = timestamps.map((stamp) => Date.parse(stamp));
  const first = DAY.format(Math.min(...times));
  const last = DAY.format(Math.max(...times));
  return first === last ? `on ${first}` : `between ${first} and ${last}`;
}
