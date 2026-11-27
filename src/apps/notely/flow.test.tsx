// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { applyFormat, wordCount } from "./data";

beforeEach(() => {
  window.location.hash = "";
});

afterEach(cleanup);

const value = (testId: string) =>
  (screen.getByTestId(testId) as HTMLInputElement).value;

describe("notely flow", () => {
  it("opens, edits and tags a note, then creates one in a folder in the three-pane baseline", () => {
    render(<App variant="baseline" />);
    expect(screen.getByTestId("tag-filter")).toBeTruthy();
    expect(screen.getByTestId("empty-editor")).toBeTruthy();

    fireEvent.click(screen.getByTestId("note-n1"));
    fireEvent.change(screen.getByTestId("note-title"), {
      target: { value: "Q1 roadmap sync notes" },
    });
    fireEvent.change(screen.getByTestId("note-body"), {
      target: { value: "Updated agenda" },
    });
    expect(screen.getByTestId("note-n1").textContent).toMatch(
      /Q1 roadmap sync notes/,
    );

    fireEvent.change(screen.getByTestId("tag-input"), {
      target: { value: "urgent" },
    });
    fireEvent.click(screen.getByTestId("add-tag"));
    expect(screen.getByTestId("note-tags").textContent).toMatch(/urgent/);
    fireEvent.click(screen.getByTestId("tag-filter-urgent"));
    expect(screen.getByTestId("note-n1")).toBeTruthy();
    expect(screen.queryByTestId("note-n2")).toBeNull();
    fireEvent.click(screen.getByTestId("tag-filter-urgent"));

    fireEvent.click(screen.getByTestId("folder-work"));
    fireEvent.click(screen.getByTestId("new-note"));
    expect(value("note-title")).toBe("Untitled note");
    expect(screen.getByTestId("toasts").textContent).toMatch(
      /Note created in Work/,
    );
    expect(document.body.textContent).toContain(
      `Created ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    );

    fireEvent.click(screen.getByTestId("folder-all"));
    fireEvent.click(screen.getByTestId("note-n5"));
    expect(screen.getByTestId("note-edited").textContent).toMatch(/Edited on [A-Z][a-z]{2} \d/);
  });

  it("uses a card grid and full-page editor with no tags in the variant", () => {
    render(<App variant="variant" />);
    expect(screen.queryByTestId("tag-filter")).toBeNull();
    expect(screen.getByTestId("note-search")).toBeTruthy();

    fireEvent.click(screen.getByTestId("note-n1"));
    expect(screen.queryByTestId("tag-input")).toBeNull();
    expect(screen.queryByTestId("note-tags")).toBeNull();
    fireEvent.change(screen.getByTestId("note-title"), {
      target: { value: "Q1 roadmap sync notes" },
    });
    fireEvent.click(screen.getByTestId("back-to-notes"));
    expect(screen.getByTestId("note-n1").textContent).toMatch(
      /Q1 roadmap sync notes/,
    );

    fireEvent.click(screen.getByTestId("folder-work"));
    fireEvent.click(screen.getByTestId("new-note"));
    expect(value("note-title")).toBe("Untitled note");
    expect(screen.getByTestId("toasts").textContent).toMatch(
      /Note created in Work/,
    );
  });
});

describe("notely formatting", () => {
  it("wraps the selection and prefixes selected lines", () => {
    expect(applyFormat("make this bold", 5, 9, "bold").text).toBe("make **this** bold");
    expect(applyFormat("abc", 3, 3, "italic").text).toBe("abc_italic text_");
    expect(applyFormat("one\ntwo\nthree", 0, 7, "number").text).toBe("1. one\n2. two\nthree");
    expect(applyFormat("- one\ntwo", 0, 9, "bullet").text).toBe("- one\n- two");
    expect(wordCount("  hello   world \n again ")).toBe(3);
    expect(wordCount("   ")).toBe(0);
  });
});
