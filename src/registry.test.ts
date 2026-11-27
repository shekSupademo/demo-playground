import { describe, expect, it } from "vitest";
import { appIds, apps, isAppId } from "./registry";

describe("registry", () => {
  it("covers every change type from 1 to 63 exactly once", () => {
    const items = apps
      .flatMap((app) => app.changes.map((change) => change.item))
      .sort((a, b) => a - b);
    expect(items).toEqual(Array.from({ length: 63 }, (_, i) => i + 1));
  });

  it("lists every app id once, in order", () => {
    expect(apps.map((app) => app.id)).toEqual([...appIds]);
  });

  it("recognizes app ids", () => {
    expect(isAppId("plano")).toBe(true);
    expect(isAppId("northbeam")).toBe(false);
  });
});
