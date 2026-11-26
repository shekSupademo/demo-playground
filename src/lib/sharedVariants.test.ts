import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultVariants } from "./demoVariants";
import { loadSharedVariants, saveSharedVariants } from "./sharedVariants";

const stored = {
  cards: "variant",
  payments: "baseline",
  bills: "baseline",
  insights: "variant",
} as const;
const rowUrl = "https://project.supabase.co/rest/v1/demo_variants?id=eq.1";
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("loadSharedVariants", () => {
  it("returns the saved row", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ variants: stored }]));
    expect(await loadSharedVariants()).toEqual(stored);
    expect(fetchMock).toHaveBeenCalledWith(
      `${rowUrl}&select=variants`,
      expect.objectContaining({
        headers: { apikey: "sb_publishable_test" },
      }),
    );
  });

  it.each([
    ["nothing is saved yet", Response.json([{ variants: null }])],
    ["the row is missing", Response.json([])],
    [
      "the saved value is invalid",
      Response.json([{ variants: { cards: "on" } }]),
    ],
    ["Supabase fails", new Response("nope", { status: 500 })],
  ])("falls back to the defaults when %s", async (_, response) => {
    fetchMock.mockResolvedValueOnce(response);
    expect(await loadSharedVariants()).toEqual(defaultVariants);
  });

  it("falls back to the defaults when the network fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(await loadSharedVariants()).toEqual(defaultVariants);
  });

  it("falls back to the defaults without calling Supabase when it is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    expect(await loadSharedVariants()).toEqual(defaultVariants);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("saveSharedVariants", () => {
  it("updates the row and reports success", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ variants: stored }]));
    expect(await saveSharedVariants(stored)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(rowUrl, {
      method: "PATCH",
      headers: {
        apikey: "sb_publishable_test",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ variants: stored }),
    });
  });

  it("reports failure when no row was updated", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));
    expect(await saveSharedVariants(stored)).toBe(false);
  });

  it("reports failure when Supabase rejects the update", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("check violation", { status: 400 }),
    );
    expect(await saveSharedVariants(stored)).toBe(false);
  });

  it("reports failure when the network fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(await saveSharedVariants(stored)).toBe(false);
  });

  it("reports failure without calling Supabase when it is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await saveSharedVariants(stored)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
