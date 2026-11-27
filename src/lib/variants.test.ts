import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadAllVariants,
  loadVariant,
  saveVariants,
  variantOverride,
} from "./variants";
import { appIds } from "../registry";

const tableUrl = "https://project.supabase.co/rest/v1/demo_apps";
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

describe("variantOverride", () => {
  it.each([
    ["?variant=variant", "variant"],
    ["?variant=baseline", "baseline"],
    ["?variant=other", null],
    ["", null],
  ])("reads %j as %j", (search, expected) => {
    expect(variantOverride(search)).toBe(expected);
  });
});

describe("loadVariant", () => {
  it("returns the app's saved variant", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ variant: "variant" }]));
    expect(await loadVariant("plano")).toBe("variant");
    expect(fetchMock).toHaveBeenCalledWith(
      `${tableUrl}?id=eq.plano&select=variant`,
      expect.objectContaining({ headers: { apikey: "sb_publishable_test" } }),
    );
  });

  it.each([
    ["the row is missing", () => Response.json([])],
    ["the value is invalid", () => Response.json([{ variant: "other" }])],
    ["Supabase fails", () => new Response("nope", { status: 500 })],
  ])("falls back to baseline when %s", async (_, response) => {
    fetchMock.mockResolvedValueOnce(response());
    expect(await loadVariant("plano")).toBe("baseline");
  });

  it("falls back to baseline when the network fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(await loadVariant("plano")).toBe("baseline");
  });

  it("falls back to baseline without calling Supabase when it is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    expect(await loadVariant("plano")).toBe("baseline");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("loadAllVariants", () => {
  it("returns every app, defaulting missing or invalid rows to baseline", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([
        { id: "plano", variant: "variant" },
        { id: "pipeline", variant: "other" },
        { id: "unknown", variant: "variant" },
      ]),
    );
    const variants = await loadAllVariants();
    expect(variants?.plano).toBe("variant");
    expect(variants?.pipeline).toBe("baseline");
    expect(variants?.notely).toBe("baseline");
    expect(Object.keys(variants ?? {})).toHaveLength(appIds.length);
    expect(fetchMock).toHaveBeenCalledWith(
      `${tableUrl}?select=id,variant`,
      expect.anything(),
    );
  });

  it("returns null when Supabase can't be read", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    expect(await loadAllVariants()).toBeNull();
  });

  it("returns null when Supabase is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await loadAllVariants()).toBeNull();
  });
});

describe("saveVariants", () => {
  it("updates the given apps and reports success when every row changed", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: "plano" }, { id: "notely" }]),
    );
    expect(await saveVariants(["plano", "notely"], "variant")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(`${tableUrl}?id=in.(plano,notely)`, {
      method: "PATCH",
      headers: {
        apikey: "sb_publishable_test",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ variant: "variant" }),
    });
  });

  it("reports failure when fewer rows changed", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ id: "plano" }]));
    expect(await saveVariants(["plano", "notely"], "variant")).toBe(false);
  });

  it("reports failure when Supabase rejects the update", async () => {
    fetchMock.mockResolvedValueOnce(new Response("denied", { status: 401 }));
    expect(await saveVariants(["plano"], "baseline")).toBe(false);
  });

  it("reports failure when the network fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(await saveVariants(["plano"], "baseline")).toBe(false);
  });
});
