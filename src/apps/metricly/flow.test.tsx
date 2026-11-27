// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const routes = {
  baseline: ["#/dashboard", "#/reports", "#/reports?report=funnel", "#/reports?report=churn", "#/reports?report=revenue", "#/exports", "#/alerts", "#/settings", "#/settings?tab=billing"],
  variant: ["#/overview", "#/insights", "#/insights?report=adoption", "#/insights?report=churn", "#/alerts", "#/account/profile", "#/account/billing"],
};
const nav = {
  baseline: ["nav-dashboard", "nav-reports", "nav-exports", "nav-alerts", "nav-settings"],
  variant: ["nav-overview", "nav-insights", "nav-alerts", "nav-profile", "nav-billing"],
};

describe.each(["baseline", "variant"] as const)("metricly %s", (variant) => {
  it.each(routes[variant])("renders %s", (hash) => {
    window.location.hash = hash;
    render(<App variant={variant} />);
    expect(screen.queryByTestId("not-found")).toBeNull();
  });

  it("shows its own menu", () => {
    window.location.hash = "#/";
    render(<App variant={variant} />);
    const ids = Array.from(document.querySelectorAll("[data-testid^=nav-]")).map((e) => e.getAttribute("data-testid"));
    expect(ids).toEqual(nav[variant]);
  });

  it.each(["#/dashboard", "#/reports", "#/settings", "#/exports"])("handles the old link %s", (hash) => {
    window.location.hash = hash;
    render(<App variant={variant} />);
    expect(screen.queryByTestId("not-found") !== null).toBe(variant === "variant");
  });

  it("completes the recorded flow", () => {
    vi.useFakeTimers();
    window.location.hash = variant === "variant" ? "#/overview" : "#/dashboard";
    render(<App variant={variant} />);
    const before = screen.getByTestId("kpi-active-users").textContent;
    fireEvent.click(screen.getByTestId("range-7d"));
    expect(screen.getByTestId("kpi-active-users").textContent).not.toBe(before);
    fireEvent.click(screen.getByTestId("view-reports"));
    expect(screen.getByTestId("report-detail")).toBeTruthy();
    fireEvent.click(screen.getByTestId("report-funnel"));
    if (variant === "baseline") fireEvent.click(screen.getByTestId("nav-exports"));
    fireEvent.click(screen.getByTestId("export-format-pdf"));
    fireEvent.click(screen.getByTestId("export-report"));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByTestId("toasts").textContent).toContain("exported as PDF");
    fireEvent.click(screen.getByTestId("nav-alerts"));
    fireEvent.click(screen.getByTestId("new-alert"));
    fireEvent.click(screen.getByTestId("create-alert"));
    expect(screen.getByText("Name is required")).toBeTruthy();
    fireEvent.change(screen.getByTestId("alert-name"), { target: { value: "Zeta" } });
    fireEvent.change(screen.getByTestId("alert-threshold"), { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("create-alert"));
    expect(screen.getByTestId("alert-list").textContent).toContain("Zeta");
    fireEvent.click(screen.getByTestId(variant === "variant" ? "nav-profile" : "nav-settings"));
    fireEvent.change(screen.getByTestId("profile-name"), { target: { value: "Jo Ellis" } });
    fireEvent.click(screen.getByTestId("save-profile"));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByTestId("toasts").textContent).toContain("Profile saved");
    fireEvent.click(screen.getByTestId(variant === "variant" ? "nav-billing" : "settings-tab-billing"));
    fireEvent.click(screen.getByTestId("plan-scale"));
    fireEvent.click(screen.getByTestId("change-plan"));
    expect(screen.getByTestId("toasts").textContent).toContain("Plan changed to Scale");
  });
});
