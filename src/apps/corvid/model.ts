export type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

export type Status = { id: string; name: string; category: StatusCategory };

export type Issue = {
  id: string;
  key: string;
  teamId: string;
  title: string;
  description: string;
  statusId: string;
  priority: number;
  assigneeId: string | null;
  labelIds: string[];
  projectId: string | null;
  milestoneId: string | null;
  cycleId: string | null;
  parentId: string | null;
  estimate: number | null;
  due: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FilterField =
  | "status"
  | "priority"
  | "assignee"
  | "label"
  | "project"
  | "cycle";

export type Filter = {
  field: FilterField;
  op: "is" | "is not";
  values: string[];
};

export type GroupBy = "status" | "priority" | "assignee" | "project" | "none";

export type OrderBy = "priority" | "updated" | "created" | "due";

export type Display = {
  layout: "list" | "board";
  groupBy: GroupBy;
  orderBy: OrderBy;
  showSubIssues: boolean;
  showEmptyGroups: boolean;
};

export const priorities = [
  { value: 1, label: "Urgent" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" },
  { value: 0, label: "No priority" },
];

export const priorityLabel = (value: number) =>
  priorities.find((p) => p.value === value)?.label ?? "No priority";

function fieldValues(issue: Issue, field: FilterField): string[] {
  switch (field) {
    case "status":
      return [issue.statusId];
    case "priority":
      return [String(issue.priority)];
    case "assignee":
      return [issue.assigneeId ?? "none"];
    case "label":
      return issue.labelIds;
    case "project":
      return [issue.projectId ?? "none"];
    case "cycle":
      return [issue.cycleId ?? "none"];
  }
}

export function applyFilters(issues: Issue[], filters: Filter[]) {
  const active = filters.filter((f) => f.values.length > 0);
  return issues.filter((issue) =>
    active.every((f) => {
      const hit = fieldValues(issue, f.field).some((v) => f.values.includes(v));
      return f.op === "is" ? hit : !hit;
    }),
  );
}

const rank = (priority: number) => (priority === 0 ? 5 : priority);

export function sortIssues(issues: Issue[], orderBy: OrderBy) {
  const byUpdated = (a: Issue, b: Issue) =>
    b.updatedAt.localeCompare(a.updatedAt);
  const compare: Record<OrderBy, (a: Issue, b: Issue) => number> = {
    priority: (a, b) => rank(a.priority) - rank(b.priority) || byUpdated(a, b),
    updated: byUpdated,
    created: (a, b) => b.createdAt.localeCompare(a.createdAt),
    due: (a, b) =>
      (a.due ?? "9999").localeCompare(b.due ?? "9999") || byUpdated(a, b),
  };
  return [...issues].sort(compare[orderBy]);
}

export type Group = { key: string; label: string; issues: Issue[] };

export type GroupContext = {
  statuses: Status[];
  people: { id: string; name: string }[];
  projects: { id: string; name: string }[];
};

export function groupIssues(
  issues: Issue[],
  groupBy: GroupBy,
  ctx: GroupContext,
  includeEmpty = false,
): Group[] {
  if (groupBy === "none") return [{ key: "all", label: "All issues", issues }];
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name);
  const buckets: {
    key: string;
    label: string;
    match: (i: Issue) => boolean;
  }[] =
    groupBy === "status"
      ? ctx.statuses.map((s) => ({
          key: s.id,
          label: s.name,
          match: (i) => i.statusId === s.id,
        }))
      : groupBy === "priority"
        ? priorities.map((p) => ({
            key: String(p.value),
            label: p.label,
            match: (i) => i.priority === p.value,
          }))
        : groupBy === "assignee"
          ? [
              ...[...ctx.people]
                .sort(byName)
                .map((p) => ({
                  key: p.id,
                  label: p.name,
                  match: (i: Issue) => i.assigneeId === p.id,
                })),
              {
                key: "none",
                label: "No assignee",
                match: (i: Issue) => i.assigneeId === null,
              },
            ]
          : [
              ...[...ctx.projects]
                .sort(byName)
                .map((p) => ({
                  key: p.id,
                  label: p.name,
                  match: (i: Issue) => i.projectId === p.id,
                })),
              {
                key: "none",
                label: "No project",
                match: (i: Issue) => i.projectId === null,
              },
            ];
  return buckets
    .map(({ key, label, match }) => ({
      key,
      label,
      issues: issues.filter(match),
    }))
    .filter((g) => includeEmpty || g.issues.length > 0);
}

export function progress(issues: Issue[], statuses: Status[]) {
  const category = (i: Issue) =>
    statuses.find((s) => s.id === i.statusId)?.category;
  const counted = issues.filter((i) => category(i) !== "canceled");
  const done = counted.filter((i) => category(i) === "completed").length;
  return {
    done,
    total: counted.length,
    pct: counted.length ? Math.round((done / counted.length) * 100) : 0,
  };
}
