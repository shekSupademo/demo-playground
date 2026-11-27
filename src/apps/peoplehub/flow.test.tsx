// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { daysFromToday } from "../../kit";
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

const fieldOrder = {
  baseline: ["firstName", "lastName", "email", "phone", "fax", "jobTitle", "department", "manager", "employeeId", "startDate"],
  variant: ["firstName", "lastName", "pronouns", "email", "phone", "department", "jobTitle", "manager", "employeeId", "startDate"],
};
const requiredErrors = {
  baseline: ["firstName", "lastName", "email", "jobTitle", "department", "manager", "employeeId", "startDate"],
  variant: ["firstName", "lastName", "email", "phone", "department", "jobTitle", "employeeId", "startDate"],
};

describe.each(["baseline", "variant"] as const)("peoplehub %s", (variant) => {
  it.each(["#/home", "#/directory", "#/people/1066", "#/people/missing", "#/time-off", "#/settings", "#/add"])(
    "renders %s",
    (hash) => {
      window.location.hash = hash;
      render(<App variant={variant} />);
      expect(document.body.textContent?.length).toBeGreaterThan(200);
    },
  );

  it("keeps the registry field order and required rules", () => {
    window.location.hash = "#/add";
    render(<App variant={variant} />);
    const ids = Array.from(document.querySelectorAll("[data-testid^=field-]")).map((e) => e.id.replace("field-", ""));
    expect(ids).toEqual(fieldOrder[variant]);
    fireEvent.click(screen.getByTestId("submit-employee"));
    const errors = Array.from(document.querySelectorAll("[data-testid^=error-]")).map((e) =>
      e.getAttribute("data-testid")?.replace("error-", ""),
    );
    expect(errors).toEqual(requiredErrors[variant]);
  });

  it("applies the variant format rules only in the variant", () => {
    window.location.hash = "#/add";
    render(<App variant={variant} />);
    const set = (k: string, value: string) => fireEvent.change(screen.getByTestId(`field-${k}`), { target: { value } });
    set("email", "zed@example.com");
    set("employeeId", "1234");
    set("startDate", daysFromToday(-3));
    fireEvent.click(screen.getByTestId("submit-employee"));
    const has = (k: string) => screen.queryByTestId(`error-${k}`) !== null;
    expect([has("email"), has("employeeId"), has("startDate")]).toEqual(
      variant === "variant" ? [true, true, true] : [false, false, false],
    );
  });

  it("adds an employee and finds them in the directory", () => {
    vi.useFakeTimers();
    window.location.hash = "#/add";
    render(<App variant={variant} />);
    const set = (k: string, value: string) => fireEvent.change(screen.getByTestId(`field-${k}`), { target: { value } });
    set("firstName", "Zed");
    set("lastName", "Quill");
    set("email", "zed.quill@acme.com");
    set("phone", "+1 415 555 0100");
    set("jobTitle", "Engineer");
    set("department", "Engineering");
    set("manager", "Grace Okafor");
    set("employeeId", "EMP-9999");
    set("startDate", daysFromToday(3));
    fireEvent.click(screen.getByTestId("submit-employee"));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(window.location.hash).toBe("#/directory");
    fireEvent.change(screen.getByTestId("directory-search"), { target: { value: "quill" } });
    expect(screen.getByTestId("result-count").textContent).toContain("of 1");
    expect(screen.getByTestId("directory-table").textContent).toContain("Zed Quill");
  });
});
