import { daysFromToday } from "../../kit";

export type StepId =
  | "purpose"
  | "company"
  | "destination"
  | "dates"
  | "guests"
  | "room"
  | "guestsRoom"
  | "extras"
  | "review";
export type RoomId = "standard" | "deluxe" | "suite";
export type Purpose = "leisure" | "business";
export type Booking = {
  purpose: Purpose;
  company: string;
  vat: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  room: RoomId;
  extras: string[];
};

export type Scene =
  | "river"
  | "temple"
  | "mountain"
  | "harbour"
  | "beach"
  | "aurora";
export type Hotel = {
  id: string;
  name: string;
  hotel: string;
  area: string;
  rating: number;
  reviews: number;
  rate: number;
  stars: number;
  perks: string[];
  scene: Scene;
  freeCancellation: boolean;
};

export const destinations: Hotel[] = [
  {
    id: "lisbon",
    name: "Lisbon, Portugal",
    hotel: "Casa do Rio Hotel",
    area: "Cais do Sodré, 0.4 km from the river",
    rating: 9.1,
    reviews: 2184,
    rate: 140,
    stars: 4,
    perks: ["Rooftop terrace", "Free Wi-Fi", "Breakfast available"],
    scene: "river",
    freeCancellation: true,
  },
  {
    id: "kyoto",
    name: "Kyoto, Japan",
    hotel: "Higashiyama Garden Inn",
    area: "Higashiyama, 6 min walk to Yasaka Shrine",
    rating: 9.4,
    reviews: 1362,
    rate: 185,
    stars: 4,
    perks: ["Private garden", "Onsen bath", "Free Wi-Fi"],
    scene: "temple",
    freeCancellation: true,
  },
  {
    id: "capetown",
    name: "Cape Town, South Africa",
    hotel: "Bay View Lodge",
    area: "Camps Bay, steps from the beach",
    rating: 8.7,
    reviews: 941,
    rate: 120,
    stars: 3,
    perks: ["Ocean view", "Outdoor pool", "Free parking"],
    scene: "mountain",
    freeCancellation: false,
  },
  {
    id: "vancouver",
    name: "Vancouver, Canada",
    hotel: "Harbourfront Suites",
    area: "Coal Harbour, 1.2 km from downtown",
    rating: 8.9,
    reviews: 3057,
    rate: 210,
    stars: 4,
    perks: ["Harbour view", "Fitness centre", "Pet friendly"],
    scene: "harbour",
    freeCancellation: true,
  },
  {
    id: "barcelona",
    name: "Barcelona, Spain",
    hotel: "Hotel Mirador de la Barceloneta, Beachfront Collection",
    area: "La Barceloneta, 150 m from the beach",
    rating: 8.4,
    reviews: 4410,
    rate: 165,
    stars: 4,
    perks: ["Beachfront", "Bar", "Air conditioning"],
    scene: "beach",
    freeCancellation: true,
  },
  {
    id: "reykjavik",
    name: "Reykjavík, Iceland",
    hotel: "Northlight Guesthouse",
    area: "Miðborg, 0.8 km from Hallgrímskirkja",
    rating: 9.0,
    reviews: 618,
    rate: 155,
    stars: 3,
    perks: ["Aurora wake-up calls", "Shared kitchen", "Free Wi-Fi"],
    scene: "aurora",
    freeCancellation: false,
  },
];

export const rooms: {
  id: RoomId;
  name: string;
  detail: string;
  size: number;
  sleeps: number;
  factor: number;
}[] = [
  {
    id: "standard",
    name: "Standard",
    detail: "Queen bed, city view",
    size: 22,
    sleeps: 2,
    factor: 1,
  },
  {
    id: "deluxe",
    name: "Deluxe",
    detail: "King bed, balcony",
    size: 30,
    sleeps: 3,
    factor: 1.5,
  },
  {
    id: "suite",
    name: "Suite",
    detail: "Separate living room",
    size: 48,
    sleeps: 4,
    factor: 2.4,
  },
];

export const extras = [
  {
    id: "breakfast",
    name: "Breakfast buffet",
    detail: "Served 7 to 10:30 AM, per guest",
    price: 24,
    perNight: true,
  },
  {
    id: "transfer",
    name: "Airport transfer",
    detail: "Private car, meet and greet at arrivals",
    price: 45,
    perNight: false,
  },
  {
    id: "late",
    name: "Late checkout (2 PM)",
    detail: "Keep your room until 2 PM on departure day",
    price: 30,
    perNight: false,
  },
];

export const TAX_RATE = 0.12;

export function stepsFor(v: boolean, purpose: Purpose): StepId[] {
  return v
    ? [
        "purpose",
        ...(purpose === "business" ? (["company"] as const) : []),
        "dates",
        "destination",
        "guestsRoom",
        "review",
      ]
    : ["destination", "dates", "guests", "room", "extras", "review"];
}

export function initialBooking(v: boolean): Booking {
  return {
    purpose: "leisure",
    company: "",
    vat: "",
    destination: "lisbon",
    checkIn: daysFromToday(21),
    checkOut: daysFromToday(24),
    guests: v ? 2 : 1,
    room: v ? "deluxe" : "standard",
    extras: [],
  };
}

export const hotelOf = (id: string) =>
  destinations.find((d) => d.id === id) ?? destinations[0];

export const roomRate = (hotelId: string, room: RoomId) =>
  Math.round(
    hotelOf(hotelId).rate * (rooms.find((r) => r.id === room)?.factor ?? 1),
  );

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOf(b: Booking) {
  const span = (Date.parse(b.checkOut) - Date.parse(b.checkIn)) / 86_400_000;
  const nights = Number.isFinite(span) ? Math.max(0, Math.round(span)) : 0;
  const rate = roomRate(b.destination, b.room);
  const roomTotal = rate * nights;
  const chosen = extras.filter((e) => b.extras.includes(e.id));
  const extrasTotal = nights
    ? chosen.reduce(
        (sum, e) => sum + (e.perNight ? e.price * nights : e.price),
        0,
      )
    : 0;
  const taxes = round2((roomTotal + extrasTotal) * TAX_RATE);
  return {
    nights,
    rate,
    roomTotal,
    chosen,
    extrasTotal,
    taxes,
    total: round2(roomTotal + extrasTotal + taxes),
  };
}
