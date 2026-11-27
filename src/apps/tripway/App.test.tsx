// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(cleanup);

const advanceToReview = () => {
  while (!screen.queryByTestId("book-now")) {
    fireEvent.click(screen.getByTestId("next-step"));
  }
};

describe("tripway flow", () => {
  it("baseline asks for confirmation before booking", () => {
    render(<App variant="baseline" />);
    expect(screen.getByTestId("destination-lisbon")).toBeTruthy();
    advanceToReview();
    fireEvent.click(screen.getByTestId("book-now"));
    expect(screen.queryByTestId("booked")).toBeNull();
    fireEvent.click(screen.getByTestId("confirm-booking"));
    expect(screen.getByTestId("booked")).toBeTruthy();
  });

  it("variant books a business trip immediately after company details", () => {
    render(<App variant="variant" />);
    fireEvent.click(screen.getByTestId("purpose-business"));
    fireEvent.click(screen.getByTestId("next-step"));
    fireEvent.change(screen.getByTestId("company-name"), {
      target: { value: "Northwind Traders" },
    });
    advanceToReview();
    expect(screen.getByTestId("summary").textContent).toContain(
      "Northwind Traders",
    );
    fireEvent.click(screen.getByTestId("book-now"));
    expect(screen.getByTestId("booked")).toBeTruthy();
  });

  it("shows a placeholder instead of an invalid date when check-in is cleared", () => {
    render(<App variant="variant" />);
    fireEvent.click(screen.getByTestId("next-step"));
    fireEvent.change(screen.getByTestId("check-in"), { target: { value: "" } });
    expect(document.body.textContent).not.toContain("Invalid Date");
    expect(document.body.textContent).not.toContain("NaN");
    expect(
      (screen.getByTestId("next-step") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
