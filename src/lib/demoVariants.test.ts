import { describe, expect, it } from "vitest";
import { parseVariants } from "./demoVariants";

describe("parseVariants", () => {
  it("accepts every feature set to baseline or variant", () => {
    const value = {
      cards: "variant",
      payments: "baseline",
      bills: "variant",
      insights: "baseline",
    };
    expect(parseVariants(value)).toEqual(value);
  });

  it("drops unknown keys", () => {
    expect(
      parseVariants({
        cards: "variant",
        payments: "baseline",
        bills: "baseline",
        insights: "baseline",
        extra: "x",
      }),
    ).toEqual({
      cards: "variant",
      payments: "baseline",
      bills: "baseline",
      insights: "baseline",
    });
  });

  it.each([
    null,
    "cards",
    [],
    { cards: "variant" },
    {
      cards: "on",
      payments: "baseline",
      bills: "baseline",
      insights: "baseline",
    },
  ])("rejects %j", (value) => {
    expect(parseVariants(value)).toBeNull();
  });
});
