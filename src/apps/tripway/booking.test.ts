import { describe, expect, it } from "vitest";
import { initialBooking, priceOf, stepsFor } from "./booking";

describe("tripway booking", () => {
  it("baseline goes destination, dates, guests, room, extras, review", () => {
    expect(stepsFor(false, "leisure")).toEqual([
      "destination",
      "dates",
      "guests",
      "room",
      "extras",
      "review",
    ]);
  });

  it("variant puts purpose first, dates before destination, and merges guests and room", () => {
    expect(stepsFor(true, "leisure")).toEqual([
      "purpose",
      "dates",
      "destination",
      "guestsRoom",
      "review",
    ]);
  });

  it("variant business trips add company details after purpose", () => {
    expect(stepsFor(true, "business")).toEqual([
      "purpose",
      "company",
      "dates",
      "destination",
      "guestsRoom",
      "review",
    ]);
  });

  it("defaults to 1 guest and Standard in baseline, 2 guests and Deluxe in variant", () => {
    expect(initialBooking(false)).toMatchObject({
      guests: 1,
      room: "standard",
    });
    expect(initialBooking(true)).toMatchObject({ guests: 2, room: "deluxe" });
  });

  it("prices room nights, per-night and one-off extras, and taxes", () => {
    const booking = {
      ...initialBooking(false),
      destination: "lisbon",
      checkIn: "2026-12-18",
      checkOut: "2026-12-21",
      room: "standard" as const,
      extras: ["breakfast", "transfer"],
    };
    const price = priceOf(booking);
    expect(price.nights).toBe(3);
    expect(price.rate).toBe(140);
    expect(price.roomTotal).toBe(420);
    expect(price.extrasTotal).toBe(24 * 3 + 45);
    expect(price.taxes).toBe(Math.round((420 + 117) * 0.12 * 100) / 100);
    expect(price.total).toBe(420 + 117 + price.taxes);
  });

  it("prices zero nights when check-out is not after check-in", () => {
    const booking = {
      ...initialBooking(false),
      checkIn: "2026-12-21",
      checkOut: "2026-12-21",
    };
    expect(priceOf(booking).nights).toBe(0);
    expect(priceOf(booking).total).toBe(0);
  });

  it("prices zero nights when a date is missing", () => {
    const booking = { ...initialBooking(true), checkIn: "" };
    expect(priceOf(booking).nights).toBe(0);
    expect(priceOf(booking).total).toBe(0);
  });
});
