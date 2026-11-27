// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.location.hash = "";
});

function fakeDataTransfer() {
  const store: Record<string, string> = {};
  return {
    setData: (type: string, value: string) => {
      store[type] = value;
    },
    getData: (type: string) => store[type] ?? "",
    get types() {
      return Object.keys(store);
    },
    effectAllowed: "",
    dropEffect: "",
  };
}

describe("filebox", () => {
  it("baseline shows a visible search box, folder links and no checkboxes", () => {
    render(<App variant="baseline" />);
    expect(screen.getByTestId("search").tagName).toBe("INPUT");
    expect(screen.queryByTestId("open-search")).toBeNull();
    expect(screen.getByTestId("folder-documents").tagName).toBe("A");
    expect(document.querySelector("input[type=checkbox]")).toBeNull();
  });

  it("variant hides the search box behind a command palette button and selects folders on click", () => {
    render(<App variant="variant" />);
    expect(screen.queryByTestId("search")).toBeNull();
    expect(screen.getByTestId("open-search")).toBeTruthy();
    const tile = screen.getByTestId("folder-documents");
    expect(tile.tagName).toBe("BUTTON");
    fireEvent.click(tile);
    expect(tile.getAttribute("aria-pressed")).toBe("true");
  });

  it("baseline folder rows have a delete button and a move picker, without bulk selection", () => {
    window.location.hash = "#/folders/documents";
    render(<App variant="baseline" />);
    expect(screen.getByTestId("row-lease")).toBeTruthy();
    expect(screen.getByTestId("delete-lease")).toBeTruthy();
    expect(screen.queryByTestId("select-all")).toBeNull();
    fireEvent.click(screen.getByTestId("delete-lease"));
    expect(screen.queryByTestId("row-lease")).toBeNull();
  });

  it("variant folder rows offer bulk selection", () => {
    window.location.hash = "#/folders/documents";
    render(<App variant="variant" />);
    fireEvent.click(screen.getByTestId("select-lease"));
    fireEvent.click(screen.getByTestId("select-resume"));
    expect(screen.getByTestId("bulk-bar").textContent).toContain("2 selected");
    fireEvent.click(screen.getByTestId("delete-selected"));
    expect(screen.queryByTestId("row-lease")).toBeNull();
    expect(screen.queryByTestId("row-resume")).toBeNull();
  });

  it("baseline file page saves the description with a button and offers Move to", () => {
    window.location.hash = "#/files/lease";
    render(<App variant="baseline" />);
    expect(screen.getByTestId("move-file")).toBeTruthy();
    expect(screen.getByTestId("save-description")).toBeTruthy();
    expect(screen.queryByTestId("save-status")).toBeNull();
  });

  it("variant file page autosaves and has no Move to button", () => {
    window.location.hash = "#/files/lease";
    render(<App variant="variant" />);
    expect(screen.queryByTestId("move-file")).toBeNull();
    expect(screen.queryByTestId("save-description")).toBeNull();
    expect(screen.getByTestId("save-status")).toBeTruthy();
  });

  it("variant opens a folder on double-click", () => {
    render(<App variant="variant" />);
    fireEvent.doubleClick(screen.getByTestId("folder-documents"));
    expect(screen.getByTestId("row-lease")).toBeTruthy();
  });

  it("variant moves a dragged row onto a sidebar folder", () => {
    window.location.hash = "#/folders/documents";
    render(<App variant="variant" />);
    const dataTransfer = fakeDataTransfer();
    fireEvent.dragStart(screen.getByTestId("row-lease"), { dataTransfer });
    const target = screen.getByTestId("nav-folder-projects");
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    expect(screen.queryByTestId("row-lease")).toBeNull();
    expect(screen.getByTestId("toasts").textContent).toContain(
      "Moved 1 file to Projects",
    );
  });

  it("variant moves the file card onto a sidebar folder", () => {
    window.location.hash = "#/files/lease";
    render(<App variant="variant" />);
    const dataTransfer = fakeDataTransfer();
    fireEvent.dragStart(screen.getByTestId("file-card"), { dataTransfer });
    fireEvent.drop(screen.getByTestId("nav-folder-invoices"), { dataTransfer });
    expect(screen.getByTestId("back-to-folder").textContent).toBe("Invoices");
  });

  it("variant autosaves the description", () => {
    vi.useFakeTimers();
    window.location.hash = "#/files/lease";
    render(<App variant="variant" />);
    fireEvent.change(screen.getByTestId("description"), {
      target: { value: "Renewal due in March." },
    });
    expect(screen.getByTestId("save-status").textContent).toBe("Saving…");
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByTestId("save-status").textContent).toBe("Saved");
  });

  it("baseline saves the description with its button", () => {
    window.location.hash = "#/files/lease";
    render(<App variant="baseline" />);
    fireEvent.change(screen.getByTestId("description"), {
      target: { value: "Renewal due in March." },
    });
    fireEvent.click(screen.getByTestId("save-description"));
    expect(screen.getByTestId("toasts").textContent).toContain(
      "Description saved",
    );
    expect(
      (screen.getByTestId("save-description") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("variant opens the command palette with Cmd+K and baseline does not", () => {
    render(<App variant="variant" />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByTestId("command-palette")).toBeTruthy();
    expect(screen.getByTestId("search")).toBeTruthy();
    cleanup();
    render(<App variant="baseline" />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.queryByTestId("command-palette")).toBeNull();
  });

  it("baseline deletes two files one at a time", () => {
    window.location.hash = "#/folders/invoices";
    render(<App variant="baseline" />);
    fireEvent.click(screen.getByTestId("delete-inv-1042"));
    fireEvent.click(screen.getByTestId("delete-inv-1043"));
    expect(screen.queryByTestId("row-inv-1042")).toBeNull();
    expect(screen.queryByTestId("row-inv-1043")).toBeNull();
    expect(screen.getByTestId("row-vendors")).toBeTruthy();
  });

  it("variant clears the selection when the type filter changes", () => {
    window.location.hash = "#/folders/documents";
    render(<App variant="variant" />);
    fireEvent.click(screen.getByTestId("select-budget"));
    fireEvent.click(screen.getByRole("button", { name: "Spreadsheets" }));
    expect(screen.queryByTestId("bulk-bar")).toBeNull();
  });
});
