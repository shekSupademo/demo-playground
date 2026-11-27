import { describe, expect, it } from "vitest";
import {
  applyFilters,
  groupIssues,
  type Issue,
  progress,
  type Status,
  sortIssues,
} from "./model";

const statuses: Status[] = [
  { id: "backlog", name: "Backlog", category: "backlog" },
  { id: "todo", name: "Todo", category: "unstarted" },
  { id: "doing", name: "In progress", category: "started" },
  { id: "done", name: "Done", category: "completed" },
  { id: "canceled", name: "Canceled", category: "canceled" },
];

const issue = (over: Partial<Issue>): Issue => ({
  id: "x",
  key: "ENG-1",
  teamId: "eng",
  title: "Issue",
  description: "",
  statusId: "todo",
  priority: 0,
  assigneeId: null,
  labelIds: [],
  projectId: null,
  milestoneId: null,
  cycleId: null,
  parentId: null,
  estimate: null,
  due: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

const issues = [
  issue({
    id: "a",
    statusId: "todo",
    priority: 1,
    assigneeId: "maya",
    labelIds: ["bug"],
    updatedAt: "2026-11-20T00:00:00.000Z",
  }),
  issue({
    id: "b",
    statusId: "doing",
    priority: 3,
    assigneeId: "dan",
    labelIds: ["feature"],
    due: "2026-11-30",
    updatedAt: "2026-11-25T00:00:00.000Z",
  }),
  issue({
    id: "c",
    statusId: "done",
    priority: 2,
    assigneeId: "maya",
    labelIds: ["bug", "perf"],
    due: "2026-11-28",
  }),
  issue({
    id: "d",
    statusId: "backlog",
    priority: 0,
    labelIds: [],
    updatedAt: "2026-11-26T00:00:00.000Z",
  }),
  issue({ id: "e", statusId: "canceled", priority: 4, assigneeId: "dan" }),
];

const ids = (list: Issue[]) => list.map((i) => i.id);

describe("applyFilters", () => {
  it("keeps everything with no filters", () => {
    expect(ids(applyFilters(issues, []))).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("matches any of the values within one filter", () => {
    expect(
      ids(
        applyFilters(issues, [
          { field: "priority", op: "is", values: ["1", "2"] },
        ]),
      ),
    ).toEqual(["a", "c"]);
  });

  it("requires every filter to match", () => {
    expect(
      ids(
        applyFilters(issues, [
          { field: "assignee", op: "is", values: ["maya"] },
          { field: "status", op: "is not", values: ["done"] },
        ]),
      ),
    ).toEqual(["a"]);
  });

  it("treats a missing assignee as none", () => {
    expect(
      ids(
        applyFilters(issues, [
          { field: "assignee", op: "is", values: ["none"] },
        ]),
      ),
    ).toEqual(["d"]);
  });

  it("matches issues with any of the labels, or without all of them", () => {
    expect(
      ids(
        applyFilters(issues, [
          { field: "label", op: "is", values: ["perf", "feature"] },
        ]),
      ),
    ).toEqual(["b", "c"]);
    expect(
      ids(
        applyFilters(issues, [
          { field: "label", op: "is not", values: ["bug"] },
        ]),
      ),
    ).toEqual(["b", "d", "e"]);
  });

  it("ignores a filter with no values yet", () => {
    expect(
      applyFilters(issues, [{ field: "label", op: "is", values: [] }]),
    ).toHaveLength(5);
  });
});

describe("sortIssues", () => {
  it("puts urgent first and no priority last", () => {
    expect(ids(sortIssues(issues, "priority"))).toEqual([
      "a",
      "c",
      "b",
      "e",
      "d",
    ]);
  });

  it("orders by most recently updated", () => {
    expect(ids(sortIssues(issues, "updated")).slice(0, 3)).toEqual([
      "d",
      "b",
      "a",
    ]);
  });

  it("orders by due date with undated issues last", () => {
    expect(ids(sortIssues(issues, "due")).slice(0, 2)).toEqual(["c", "b"]);
  });
});

describe("groupIssues", () => {
  const ctx = {
    statuses,
    people: [
      { id: "maya", name: "Maya Chen" },
      { id: "dan", name: "Daniel Brooks" },
    ],
    projects: [],
  };

  it("groups by status in workflow order and drops empty groups", () => {
    const groups = groupIssues(issues.slice(0, 2), "status", ctx);
    expect(groups.map((g) => g.label)).toEqual(["Todo", "In progress"]);
  });

  it("keeps empty status columns for a board", () => {
    const groups = groupIssues(issues.slice(0, 2), "status", ctx, true);
    expect(groups.map((g) => g.key)).toEqual([
      "backlog",
      "todo",
      "doing",
      "done",
      "canceled",
    ]);
  });

  it("groups by assignee by name with unassigned last", () => {
    const groups = groupIssues(issues, "assignee", ctx);
    expect(groups.map((g) => [g.label, ids(g.issues)])).toEqual([
      ["Daniel Brooks", ["b", "e"]],
      ["Maya Chen", ["a", "c"]],
      ["No assignee", ["d"]],
    ]);
  });

  it("returns one group when grouping is off", () => {
    expect(groupIssues(issues, "none", ctx)).toEqual([
      { key: "all", label: "All issues", issues },
    ]);
  });
});

describe("progress", () => {
  it("counts completed issues and leaves canceled ones out", () => {
    expect(progress(issues, statuses)).toEqual({ done: 1, total: 4, pct: 25 });
  });

  it("is zero for an empty list", () => {
    expect(progress([], statuses)).toEqual({ done: 0, total: 0, pct: 0 });
  });
});
