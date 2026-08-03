export type CreatorEventSeed = {
  id: string;
  title: string;
  type: "meetup" | "salon" | "screening" | "workshop";
  city: string;
  venue: string;
  startsAt: string;
  format: "in-person" | "online" | "hybrid";
  capacity: number;
  blurb: string;
};

/** Default events used to seed the events table */
export const CREATOR_EVENTS: CreatorEventSeed[] = [
  {
    id: "yard-salon-lagos",
    title: "Yard Salon: Should Have Gone Live",
    type: "salon",
    city: "Lagos",
    venue: "Nike Art Gallery, Lekki",
    startsAt: "2026-08-14T18:30:00+01:00",
    format: "in-person",
    capacity: 40,
    blurb: "Lagos creators and PDs unpack shelved campaigns over small chops.",
  },
  {
    id: "rejection-lab-abuja",
    title: "Rejection Lab Abuja",
    type: "workshop",
    city: "Abuja",
    venue: "Thought Pyramid Art Centre",
    startsAt: "2026-08-21T17:00:00+01:00",
    format: "in-person",
    capacity: 28,
    blurb: "Bring a buried deck. Leave with a sharper case for LIVE.",
  },
  {
    id: "agency-meetup-accra",
    title: "Agency Meetup: Accra Plot",
    type: "meetup",
    city: "Accra",
    venue: "Nubuke Foundation",
    startsAt: "2026-08-28T19:00:00+00:00",
    format: "in-person",
    capacity: 60,
    blurb: "Studio leads trade unseen work and category voting tactics.",
  },
  {
    id: "online-critique",
    title: "Open Critique (Online)",
    type: "workshop",
    city: "Online",
    venue: "Zoom",
    startsAt: "2026-09-04T16:00:00+01:00",
    format: "online",
    capacity: 100,
    blurb: "Live feedback on unpublished pieces from judges and peers across Africa.",
  },
  {
    id: "screening-nairobi",
    title: "Unproduced Film Screening",
    type: "screening",
    city: "Nairobi",
    venue: "Alliance Française",
    startsAt: "2026-09-11T20:00:00+03:00",
    format: "in-person",
    capacity: 120,
    blurb: "Shorts and treatments that never made it past the boardroom.",
  },
  {
    id: "yard-drinks-jhb",
    title: "Yard Drinks Joburg",
    type: "meetup",
    city: "Johannesburg",
    venue: "Museum of African Design courtyard",
    startsAt: "2026-09-18T18:00:00+02:00",
    format: "in-person",
    capacity: 50,
    blurb: "Casual meetup for freelancers and boutique African studios.",
  },
];
