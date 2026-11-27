// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { appIds } from "../registry";
import { appLoaders } from "./loaders";

afterEach(cleanup);

describe.each(appIds)("%s", (id) => {
  it("renders different baseline and variant screens", async () => {
    const { default: App } = await appLoaders[id]();
    const baseline = render(<App variant="baseline" />).container.innerHTML;
    cleanup();
    const variant = render(<App variant="variant" />).container.innerHTML;
    expect(baseline.length).toBeGreaterThan(200);
    expect(variant).not.toBe(baseline);
  });
});
