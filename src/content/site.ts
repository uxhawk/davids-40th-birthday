// All party content lives here so it can be filled in without touching layout code.

export const site = {
  title: "David's 40th",
  tagline: "Nine days of sun, surf and tagine on the Moroccan coast.",
  host: "David",
  country: "Morocco",
  dateLabel: "November 13–21, 2027",
  start: new Date("2027-11-13T00:00:00Z"),
  end: new Date("2027-11-21T23:59:59Z"),

  rsvpDeadlineLabel: "March 31, 2027",
  // End of March 31 "anywhere on Earth", so nobody is locked out early by timezone.
  rsvpDeadline: new Date("2027-04-01T12:00:00Z"),

  // Extra people a guest can bring on their RSVP.
  maxAdditionalGuests: 4,

  // Each location renders as an embedded Google Map. `query` is what you'd type
  // into Google Maps: a place name, address, or "lat,lng".
  locations: [
    {
      name: "Taghazout",
      blurb: "Home base. A fishing village turned surf town, 20 km north of Agadir.",
      query: "Taghazout, Morocco",
      zoom: 12,
    },
  ],

  // Placeholder sections for the home page.
  sections: [
    {
      title: "The plan",
      body: "Itinerary coming soon. Expect beach days, long dinners and one big night.",
    },
    {
      title: "Getting there",
      body: "Fly into Agadir (AGA). Taghazout is about 45 minutes by car. Details to follow.",
    },
    {
      title: "Where to stay",
      body: "Accommodation options will be posted here once they're locked in.",
    },
  ],
};

export function rsvpIsOpen(now: Date = new Date()) {
  return now < site.rsvpDeadline;
}

export function siteUrl() {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
