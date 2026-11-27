// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

beforeEach(() => {
  window.location.hash = "#/";
});

afterEach(cleanup);

const click = (id: string) => fireEvent.click(screen.getByTestId(id));
const type = (id: string, value: string) =>
  fireEvent.change(screen.getByTestId(id), { target: { value } });
const toasts = () => screen.getByTestId("toasts").textContent;
const team = (tab: string) => {
  click("nav-teams");
  click("team-eng");
  click(`team-tab-${tab}`);
};
const rows = () => screen.queryAllByTestId("issue-row");

describe.each(["baseline", "variant"] as const)("corvid %s", (variant) => {
  const v = variant === "variant";

  it("keeps every demo feature off the landing page", () => {
    render(<App variant={variant} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "My issues",
    );
    for (const id of [
      "save-view",
      "add-sub-issue",
      "add-cycle-issues",
      "add-milestone",
      "add-status",
    ])
      expect(screen.queryByTestId(id)).toBeNull();
  });

  it("filters, regroups and saves a custom view", () => {
    render(<App variant={variant} />);
    team("issues");
    fireEvent.click(screen.getByRole("tab", { name: "Active" }));
    const total = rows().length;
    click("filter-button");
    click("filter-field-priority");
    click("filter-value-1");
    click("filter-value-2");
    click("filter-done");
    click("filter-button");
    click("filter-field-label");
    click("filter-value-bug");
    click("filter-done");
    const filtered = rows();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(total);
    for (const row of filtered) {
      expect(["1", "2"]).toContain(row.dataset.priority);
      expect(row.dataset.labels).toContain("bug");
    }
    click("display-button");
    click("display-layout-board");
    type("display-group", "assignee");
    expect(screen.getByTestId("board-column-none")).toBeTruthy();

    if (v) {
      expect(screen.queryByTestId("save-view")).toBeNull();
      click("menu-save-view");
    } else click("save-view");
    type("view-name", "Urgent bugs");
    click("confirm-save-view");
    expect(toasts()).toContain("Urgent bugs saved");

    click("nav-my-issues");
    if (v) {
      expect(
        within(screen.getByTestId("sidebar")).queryByText("Urgent bugs"),
      ).toBeNull();
      team("views");
    }
    fireEvent.click(
      within(screen.getByTestId(v ? "views-list" : "sidebar")).getByText(
        "Urgent bugs",
      ),
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Urgent bugs",
    );
    expect(screen.getByTestId("filter-chip-priority").textContent).toContain(
      "Urgent",
    );
    expect(screen.getByTestId("board-column-none")).toBeTruthy();
    expect(rows()).toHaveLength(filtered.length);
  });

  it("breaks an issue into sub-issues and tracks their progress", () => {
    render(<App variant={variant} />);
    team("issues");
    fireEvent.click(screen.getByText("ENG-118"));
    for (const title of ["Profile tile queries", "Cache depot geometry"]) {
      if (v) {
        expect(screen.queryByTestId("add-sub-issue")).toBeNull();
        click("menu-add-sub-issue");
      } else click("add-sub-issue");
      type("sub-issue-title", title);
      click("save-sub-issue");
    }
    expect(toasts()).toContain("Sub-issue created");
    const section = screen.getByTestId("sub-issues");
    expect((section as HTMLDetailsElement).open).toBe(!v);
    expect(screen.getByTestId("sub-issue-progress").textContent).toBe("0/2");
    const [first] = within(section).getAllByTestId("sub-issue-row");
    fireEvent.click(within(first).getByTestId("set-status-done"));
    expect(screen.getByTestId("sub-issue-progress").textContent).toBe("1/2");
  });

  it("adds backlog issues to the current cycle", () => {
    render(<App variant={variant} />);
    team("cycles");
    click("cycle-eng-24");
    const before = Number(screen.getByTestId("cycle-scope").textContent);
    if (v) {
      expect(screen.queryByTestId("add-cycle-issues")).toBeNull();
      for (const key of ["ENG-140", "ENG-141"]) {
        team("issues");
        fireEvent.click(screen.getByText(key));
        click("set-cycle-eng-24");
      }
      team("cycles");
      click("cycle-eng-24");
    } else {
      click("add-cycle-issues");
      click("pick-ENG-140");
      click("pick-ENG-141");
      click("confirm-add-issues");
      expect(toasts()).toContain("2 issues added to Cycle 24");
    }
    expect(Number(screen.getByTestId("cycle-scope").textContent)).toBe(before + 2);
  });

  it("adds a milestone to a project", () => {
    render(<App variant={variant} />);
    click("nav-initiatives");
    click("initiative-fleet-platform");
    click("project-fleet-v2");
    if (v) expect(screen.queryByTestId("tab-milestones")).toBeNull();
    else click("tab-milestones");
    click("add-milestone");
    click("save-milestone");
    expect(screen.getByText("Enter a milestone name")).toBeTruthy();
    type("milestone-name", "Pilot with two depots");
    click("save-milestone");
    expect(toasts()).toContain("Pilot with two depots created");
    expect(screen.getByTestId("milestones").textContent).toContain(
      "Pilot with two depots",
    );
  });

  it("adds a workflow status that issues can use", () => {
    window.location.hash = "#/settings";
    render(<App variant={variant} />);
    click("settings-teams");
    click("settings-team-eng");
    if (v) {
      expect(screen.queryByTestId("team-workflow")).toBeNull();
      click("team-statuses");
      click("add-status-started");
    } else {
      click("team-workflow");
      click("add-status");
      type("status-category", "started");
    }
    type("status-name", "In review");
    click("save-status");
    expect(toasts()).toContain("In review added");
    team("issues");
    fireEvent.click(screen.getAllByRole("menuitem", { name: "In review" })[0]);
    const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(groups.some((g) => g?.startsWith("In review"))).toBe(true);
  });

  it("accepts an issue from triage", () => {
    window.location.hash = "#/team/eng/triage";
    render(<App variant={variant} />);
    const count = screen.getAllByTestId("triage-item").length;
    fireEvent.click(screen.getAllByTestId("triage-item")[0]);
    click("triage-accept");
    expect(toasts()).toContain("moved to Todo");
    expect(screen.getAllByTestId("triage-item")).toHaveLength(count - 1);
  });

  it("creates an issue and finds it with the command menu", () => {
    render(<App variant={variant} />);
    click("new-issue");
    click("create-issue");
    expect(screen.getByText("Enter a title")).toBeTruthy();
    type("new-issue-title", "Depot map flickers on zoom");
    click("create-issue");
    expect(toasts()).toContain("created");
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    type("command-input", "flickers");
    fireEvent.click(
      within(screen.getByTestId("command-results")).getByText(
        "Depot map flickers on zoom",
      ),
    );
    expect(screen.getByTestId("issue-title").textContent).toBe(
      "Depot map flickers on zoom",
    );
  });
});
