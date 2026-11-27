// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  window.location.hash = "";
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const fill = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

describe("mailbird flow", () => {
  it("writes, schedules and sends a campaign in the baseline with no interruptions", () => {
    render(<App variant="baseline" />);
    expect(screen.queryByTestId("whats-new-dismiss")).toBeNull();
    expect(screen.queryByTestId("cookie-banner")).toBeNull();
    expect(screen.queryByTestId("campaign-skeleton")).toBeNull();
    expect(screen.getByTestId("campaign-c1")).toBeTruthy();

    fireEvent.click(screen.getByTestId("new-campaign"));
    fill("campaign-name", "Winter blend launch");
    fill("campaign-subject", "Meet our winter blend");
    fill("campaign-body", "Hi {first_name}, it is here.");
    expect(screen.getByTestId("deliverability").textContent).toMatch(
      /looks good/,
    );

    fireEvent.click(screen.getByTestId("schedule-campaign"));
    expect(screen.queryByTestId("upsell-dismiss")).toBeNull();
    expect(screen.getByTestId("schedule-date").hasAttribute("min")).toBe(false);
    fireEvent.click(screen.getByTestId("confirm-schedule"));
    expect(screen.getByTestId("schedule-summary")).toBeTruthy();

    const send = screen.getByTestId("send-campaign") as HTMLButtonElement;
    expect(send.disabled).toBe(false);
    fireEvent.click(send);
    expect(screen.queryByTestId("verify-code")).toBeNull();
    expect(screen.getByTestId("toasts").textContent).toMatch(
      /Campaign scheduled/,
    );
    const rows = screen.getByTestId("campaign-list").querySelectorAll("tr");
    expect(rows[0].textContent).toMatch(/Winter blend launch/);
  });

  it("puts popups, a skeleton, a check wait and a code step in the variant path", () => {
    render(<App variant="variant" />);
    fireEvent.click(screen.getByTestId("whats-new-dismiss"));
    fireEvent.click(screen.getByTestId("cookie-accept"));
    expect(screen.queryByTestId("cookie-banner")).toBeNull();
    expect(screen.getByTestId("campaign-skeleton")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByTestId("campaign-c1")).toBeTruthy();

    fireEvent.click(screen.getByTestId("new-campaign"));
    fill("campaign-name", "Winter blend launch");
    fill("campaign-subject", "Meet our winter blend");
    const send = screen.getByTestId("send-campaign") as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    fireEvent.click(screen.getByTestId("schedule-campaign"));
    fireEvent.click(screen.getByTestId("upsell-dismiss"));
    fireEvent.click(screen.getByTestId("confirm-schedule"));
    expect(screen.getByTestId("schedule-summary")).toBeTruthy();

    act(() => vi.advanceTimersByTime(2000));
    expect(send.disabled).toBe(false);
    fireEvent.click(send);
    fill("verify-code", "111111");
    fireEvent.click(screen.getByTestId("verify-submit"));
    expect(screen.getByTestId("verify-error").textContent).toMatch(/incorrect/);
    fill("verify-code", "123456");
    fireEvent.click(screen.getByTestId("verify-submit"));
    expect(screen.getByTestId("toasts").textContent).toMatch(
      /Campaign scheduled/,
    );
  });

  it("dates old drafts with a capitalized month and shows no fake results for a fresh send", () => {
    render(<App variant="baseline" />);
    fireEvent.click(screen.getByTestId("status-filter-draft"));
    expect(screen.getByTestId("campaign-c28").textContent).toMatch(/Edited on [A-Z][a-z]{2} \d/);

    fireEvent.click(screen.getByTestId("new-campaign"));
    fill("campaign-name", "Fresh send");
    fireEvent.click(screen.getByTestId("send-campaign"));
    const row = screen.getByTestId("campaign-list").querySelector("tr");
    fireEvent.click(row?.querySelector("a") as HTMLAnchorElement);
    expect(screen.getByText("Results are still coming in")).toBeTruthy();
    expect(screen.queryByText("Recent activity")).toBeNull();
  });
});
