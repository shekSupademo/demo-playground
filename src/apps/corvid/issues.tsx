import {
  Check,
  Columns3,
  Filter as FilterIcon,
  Layers,
  List,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Avatar, EmptyState, formatDate, Popover } from "../../kit";
import { cx, Dialog, Menu } from "../../ui";
import { cycles, labels, me, people, teams } from "./data";
import {
  applyFilters,
  type Display,
  type Filter,
  type FilterField,
  type GroupBy,
  groupIssues,
  type Issue,
  type OrderBy,
  priorities,
  sortIssues,
} from "./model";
import {
  AssigneeMenu,
  Header,
  LabelPill,
  PriorityIcon,
  PriorityMenu,
  StatusIcon,
  StatusMenu,
  t,
} from "./parts";
import { defaultDisplay, type SavedView, useStore } from "./store";

const fieldLabels: Record<FilterField, string> = {
  status: "Status",
  priority: "Priority",
  assignee: "Assignee",
  label: "Label",
  project: "Project",
  cycle: "Cycle",
};

function useFieldOptions(teamId: string) {
  const { statuses, projects } = useStore();
  const team = teams.find((x) => x.id === teamId) ?? teams[0];
  return (field: FilterField): { value: string; label: string }[] => {
    switch (field) {
      case "status":
        return statuses[teamId].map((s) => ({ value: s.id, label: s.name }));
      case "priority":
        return priorities.map((p) => ({
          value: String(p.value),
          label: p.label,
        }));
      case "assignee":
        return [
          ...people
            .filter((p) => team.members.includes(p.id))
            .map((p) => ({
              value: p.id,
              label: p.id === me ? `${p.name} (you)` : p.name,
            })),
          { value: "none", label: "No assignee" },
        ];
      case "label":
        return labels.map((l) => ({ value: l.id, label: l.name }));
      case "project":
        return [
          ...projects.map((p) => ({ value: p.id, label: p.name })),
          { value: "none", label: "No project" },
        ];
      case "cycle":
        return [
          ...cycles
            .filter((c) => c.teamId === teamId)
            .map((c) => ({ value: c.id, label: `Cycle ${c.number}` })),
          { value: "none", label: "No cycle" },
        ];
    }
  };
}

function FilterButton({
  teamId,
  filters,
  setFilters,
}: {
  teamId: string;
  filters: Filter[];
  setFilters: (f: Filter[]) => void;
}) {
  const [field, setField] = useState<FilterField | null>(null);
  const options = useFieldOptions(teamId);
  const current = field ? filters.find((f) => f.field === field) : undefined;
  const toggle = (value: string) => {
    if (!field) return;
    const values = current?.values.includes(value)
      ? current.values.filter((x) => x !== value)
      : [...(current?.values ?? []), value];
    setFilters(
      current
        ? filters.map((f) => (f.field === field ? { ...f, values } : f))
        : [...filters, { field, op: "is", values }],
    );
  };
  return (
    <Popover
      label="Filter issues"
      testId="filter-button"
      triggerClassName={t.chip}
      panelClassName="w-64 p-1"
      trigger={
        <>
          <FilterIcon className="size-3.5" aria-hidden /> Filter
        </>
      }
    >
      {(close) =>
        field === null ? (
          <div role="menu" aria-label="Filter by">
            <p className="px-2.5 pt-1.5 pb-1 text-xs text-slate-500">
              Filter by
            </p>
            {(Object.keys(fieldLabels) as FilterField[]).map((f) => (
              <button
                key={f}
                type="button"
                role="menuitem"
                data-testid={`filter-field-${f}`}
                onClick={() => setField(f)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-slate-100"
              >
                {fieldLabels[f]}
                {filters.some((x) => x.field === f && x.values.length) && (
                  <span className="size-1.5 rounded-full bg-[#3046C5]" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p className="px-2.5 pt-1.5 pb-1 text-xs text-slate-500">
              {fieldLabels[field]}
            </p>
            <div className="max-h-72 overflow-y-auto">
              {options(field).map((o) => {
                const on = current?.values.includes(o.value) ?? false;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    data-testid={`filter-value-${o.value}`}
                    onClick={() => toggle(o.value)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-slate-100"
                  >
                    <span
                      className={cx(
                        "grid size-4 place-items-center rounded border",
                        on
                          ? "border-[#3046C5] bg-[#3046C5] text-white"
                          : "border-slate-300",
                      )}
                    >
                      {on && <Check className="size-3" aria-hidden />}
                    </span>
                    {field === "priority" && (
                      <PriorityIcon value={Number(o.value)} />
                    )}
                    {field === "assignee" && o.value !== "none" && (
                      <Avatar name={o.label} size={18} />
                    )}
                    <span className="truncate">{o.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-100 p-1.5">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                onClick={() => setField(null)}
              >
                Back
              </button>
              <button
                type="button"
                data-testid="filter-done"
                className="rounded bg-[#3046C5] px-2.5 py-1 text-xs font-medium text-white"
                onClick={() => {
                  setField(null);
                  close();
                }}
              >
                Done
              </button>
            </div>
          </div>
        )
      }
    </Popover>
  );
}

function FilterChips({
  teamId,
  filters,
  setFilters,
}: {
  teamId: string;
  filters: Filter[];
  setFilters: (f: Filter[]) => void;
}) {
  const options = useFieldOptions(teamId);
  const active = filters.filter((f) => f.values.length);
  if (!active.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 md:px-6">
      {active.map((f) => {
        const names = options(f.field)
          .filter((o) => f.values.includes(o.value))
          .map((o) => o.label);
        return (
          <span
            key={f.field}
            data-testid={`filter-chip-${f.field}`}
            className="inline-flex h-7 items-center overflow-hidden rounded-md border border-slate-200 text-xs"
          >
            <span className="px-2 font-medium text-slate-700">
              {fieldLabels[f.field]}
            </span>
            <button
              type="button"
              className="h-full border-x border-slate-200 px-2 text-slate-500 hover:bg-slate-50"
              onClick={() =>
                setFilters(
                  filters.map((x) =>
                    x.field === f.field
                      ? { ...x, op: x.op === "is" ? "is not" : "is" }
                      : x,
                  ),
                )
              }
              aria-label={`Switch to ${f.op === "is" ? "is not" : "is"}`}
            >
              {f.values.length > 1
                ? f.op === "is"
                  ? "is any of"
                  : "is none of"
                : f.op}
            </button>
            <span
              className="max-w-56 truncate px-2 text-slate-800"
              title={names.join(", ")}
            >
              {names.join(", ")}
            </span>
            <button
              type="button"
              className="grid h-full w-7 place-items-center border-l border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              onClick={() =>
                setFilters(filters.filter((x) => x.field !== f.field))
              }
              aria-label={`Remove ${fieldLabels[f.field]} filter`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        );
      })}
      <button
        type="button"
        className="text-xs text-slate-500 hover:text-slate-900"
        onClick={() => setFilters([])}
      >
        Clear filters
      </button>
    </div>
  );
}

function DisplayButton({
  display,
  setDisplay,
}: {
  display: Display;
  setDisplay: (d: Display) => void;
}) {
  const set = <K extends keyof Display>(key: K, value: Display[K]) =>
    setDisplay({ ...display, [key]: value });
  return (
    <Popover
      label="Display options"
      testId="display-button"
      triggerClassName={t.chip}
      panelClassName="w-72 p-3"
      trigger={
        <>
          <SlidersHorizontal className="size-3.5" aria-hidden /> Display
        </>
      }
    >
      {() => (
        <div className="flex flex-col gap-3 text-[13px]">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {(["list", "board"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                data-testid={`display-layout-${layout}`}
                aria-pressed={display.layout === layout}
                onClick={() => set("layout", layout)}
                className={cx(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium",
                  display.layout === layout
                    ? "bg-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                {layout === "list" ? (
                  <List className="size-4" aria-hidden />
                ) : (
                  <Columns3 className="size-4" aria-hidden />
                )}
                {layout === "list" ? "List" : "Board"}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-600">Grouping</span>
            <select
              className={cx(t.input, "w-36 py-1")}
              value={display.groupBy}
              onChange={(e) => set("groupBy", e.target.value as GroupBy)}
              data-testid="display-group"
            >
              <option value="status">Status</option>
              <option value="assignee">Assignee</option>
              <option value="priority">Priority</option>
              <option value="project">Project</option>
              <option value="none">No grouping</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-600">Ordering</span>
            <select
              className={cx(t.input, "w-36 py-1")}
              value={display.orderBy}
              onChange={(e) => set("orderBy", e.target.value as OrderBy)}
              data-testid="display-order"
            >
              <option value="priority">Priority</option>
              <option value="updated">Last updated</option>
              <option value="created">Last created</option>
              <option value="due">Due date</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-600">Show sub-issues</span>
            <input
              type="checkbox"
              role="switch"
              className="size-4 accent-[#3046C5]"
              checked={display.showSubIssues}
              onChange={(e) => set("showSubIssues", e.target.checked)}
              data-testid="display-sub-issues"
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-600">Show empty groups</span>
            <input
              type="checkbox"
              role="switch"
              className="size-4 accent-[#3046C5]"
              checked={display.showEmptyGroups}
              onChange={(e) => set("showEmptyGroups", e.target.checked)}
              data-testid="display-empty-groups"
            />
          </label>
        </div>
      )}
    </Popover>
  );
}

function IssueRow({ issue }: { issue: Issue }) {
  const { projects, issues } = useStore();
  const project = projects.find((p) => p.id === issue.projectId);
  const subs = issues.filter((i) => i.parentId === issue.id).length;
  const overdue =
    issue.due && issue.due < new Date().toISOString().slice(0, 10);
  return (
    <li
      data-testid="issue-row"
      data-priority={issue.priority}
      data-labels={issue.labelIds.join(" ")}
      className="group flex h-10 items-center gap-2 border-b border-slate-100 px-4 text-[13px] hover:bg-slate-50 md:px-6"
    >
      <PriorityMenu issue={issue} />
      <Link to={`/issue/${issue.key}`} tabIndex={-1} className="w-16 shrink-0 text-slate-500 tabular-nums hover:text-slate-900">
        {issue.key}
      </Link>
      <StatusMenu issue={issue} />
      <Link
        to={`/issue/${issue.key}`}
        className={cx(
          "min-w-0 flex-1 truncate rounded font-medium text-slate-800",
          t.focus,
        )}
        title={issue.title}
      >
        {issue.title}
      </Link>
      {subs > 0 && (
        <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">
          {subs} sub-issues
        </span>
      )}
      <span className="hidden shrink-0 gap-1 lg:flex">
        {issue.labelIds.map((id) => (
          <LabelPill key={id} id={id} />
        ))}
      </span>
      {project && (
        <span
          className="hidden max-w-40 shrink-0 truncate text-xs text-slate-500 xl:inline"
          title={project.name}
        >
          {project.name}
        </span>
      )}
      {issue.due && (
        <span
          className={cx(
            "hidden shrink-0 text-xs sm:inline",
            overdue ? "text-rose-600" : "text-slate-500",
          )}
        >
          {formatDate(issue.due).replace(/, \d{4}$/, "")}
        </span>
      )}
      <AssigneeMenu issue={issue} />
    </li>
  );
}

function BoardCard({ issue }: { issue: Issue }) {
  return (
    <li
      data-testid="issue-row"
      data-priority={issue.priority}
      data-labels={issue.labelIds.join(" ")}
      className="rounded-lg border border-slate-200 bg-white p-3 text-[13px] shadow-xs hover:border-slate-300"
    >
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="tabular-nums">{issue.key}</span>
        <AssigneeMenu issue={issue} />
      </div>
      <Link
        to={`/issue/${issue.key}`}
        className={cx(
          "mt-1 line-clamp-2 block rounded font-medium text-slate-800",
          t.focus,
        )}
      >
        {issue.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <StatusMenu issue={issue} />
        <PriorityMenu issue={issue} />
        {issue.labelIds.map((id) => (
          <LabelPill key={id} id={id} />
        ))}
      </div>
    </li>
  );
}

export function IssueCollection({
  issues,
  display,
  teamId,
}: {
  issues: Issue[];
  display: Display;
  teamId: string | null;
}) {
  const { statuses, projects, setNewIssueOpen } = useStore();
  const team = teams.find((x) => x.id === teamId);
  const shown = sortIssues(
    display.showSubIssues ? issues : issues.filter((i) => !i.parentId),
    display.orderBy,
  );
  const groups = groupIssues(
    shown,
    display.groupBy,
    {
      statuses: statuses[teamId ?? "eng"],
      people: people.filter((p) => !team || team.members.includes(p.id)),
      projects,
    },
    display.showEmptyGroups ||
      (display.layout === "board" && display.groupBy === "status"),
  );
  if (shown.length === 0)
    return (
      <EmptyState
        icon={<Layers className="size-5" />}
        title="No issues match"
        body="Change or clear the filters to see more issues."
      />
    );
  if (display.layout === "board")
    return (
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto bg-slate-50/70 p-4">
        {groups.map((g) => (
          <section
            key={g.key}
            data-testid={`board-column-${g.key}`}
            className="flex w-72 shrink-0 flex-col gap-2"
          >
            <h3 className="flex items-center gap-2 px-1 text-[13px] font-medium">
              {display.groupBy === "status" && (
                <StatusIcon
                  category={
                    statuses[teamId ?? "eng"].find((s) => s.id === g.key)
                      ?.category ?? "backlog"
                  }
                />
              )}
              {display.groupBy === "assignee" && g.key !== "none" && (
                <Avatar name={g.label} size={18} />
              )}
              <span className="truncate">{g.label}</span>
              <span className="text-slate-400 tabular-nums">
                {g.issues.length}
              </span>
            </h3>
            <ul className="flex flex-col gap-2">
              {g.issues.map((i) => (
                <BoardCard key={i.id} issue={i} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  return (
    <div>
      {groups.map((g) => (
        <section key={g.key} data-testid={`list-group-${g.key}`}>
          {display.groupBy !== "none" && (
            <h3 className="flex h-9 items-center gap-2 bg-slate-50 px-4 text-[13px] font-medium md:px-6">
              {display.groupBy === "status" && (
                <StatusIcon
                  category={
                    statuses[teamId ?? "eng"].find((s) => s.id === g.key)
                      ?.category ?? "backlog"
                  }
                />
              )}
              {display.groupBy === "priority" && (
                <PriorityIcon value={Number(g.key)} />
              )}
              {display.groupBy === "assignee" && g.key !== "none" && (
                <Avatar name={g.label} size={18} />
              )}
              <span>{g.label}</span>
              <span className="text-slate-400 tabular-nums">
                {g.issues.length}
              </span>
              {teamId && display.groupBy === "status" && (
                <button
                  type="button"
                  className={cx(t.ghost, "ml-auto size-7")}
                  aria-label={`New issue in ${g.label}`}
                  onClick={() => setNewIssueOpen({ teamId })}
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              )}
            </h3>
          )}
          <ul>
            {g.issues.map((i) => (
              <IssueRow key={i.id} issue={i} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const scopes = {
  all: { label: "All issues", match: () => true },
  active: {
    label: "Active",
    match: (c: string) => c === "unstarted" || c === "started",
  },
  backlog: { label: "Backlog", match: (c: string) => c === "backlog" },
} as const;

type Scope = keyof typeof scopes;

function SaveViewDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const close = () => {
    setName("");
    setTouched(false);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title="Save as view"
      className={t.dialog}
    >
      <form
        className="mt-3 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!name.trim()) return;
          onSave(name.trim());
          close();
        }}
      >
        <p className="text-sm text-slate-500">
          Saves the current filters, grouping and layout. Everyone on the team
          can open it.
        </p>
        <label className="text-sm">
          <span className="font-medium">View name</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Urgent bugs"
            aria-invalid={touched && !name.trim()}
            data-testid="view-name"
          />
        </label>
        {touched && !name.trim() && (
          <p className="text-sm text-rose-600">Enter a view name</p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={close}>
            Cancel
          </button>
          <button
            type="submit"
            className={t.primary}
            data-testid="confirm-save-view"
          >
            Save view
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function IssuesWorkspace({
  teamId,
  view,
}: {
  teamId: string;
  view?: SavedView;
}) {
  const { issues, statuses, v, saveView, toast, deleteView, setNewIssueOpen } =
    useStore();
  const navigate = useNavigate();
  const team = teams.find((x) => x.id === teamId) ?? teams[0];
  const [scope, setScope] = useState<Scope>("all");
  const [filters, setFilters] = useState<Filter[]>(view?.filters ?? []);
  const [display, setDisplay] = useState<Display>(
    view?.display ?? defaultDisplay,
  );
  const [saving, setSaving] = useState(false);
  const shown = useMemo(() => {
    const inScope = issues.filter((i) => {
      if (i.teamId !== teamId) return false;
      const category =
        statuses[teamId].find((s) => s.id === i.statusId)?.category ??
        "backlog";
      return (
        category !== "triage" && (view ? true : scopes[scope].match(category))
      );
    });
    return applyFilters(inScope, filters);
  }, [issues, statuses, teamId, scope, filters, view]);
  const save = (name: string) => {
    const saved = saveView({ teamId, name, filters, display });
    navigate(`/team/${teamId}/views/${saved.id}`);
  };
  return (
    <div className="flex min-h-full flex-col">
      <Header
        crumbs={[
          { label: team.name, to: `/team/${teamId}/issues` },
          ...(view
            ? [
                ...(v ? [{ label: "Views", to: `/team/${teamId}/views` }] : []),
                { label: view.name },
              ]
            : [{ label: "Issues" }]),
        ]}
        actions={
          <>
            <button
              type="button"
              className={t.secondary}
              onClick={() => setNewIssueOpen({ teamId })}
            >
              <Plus className="size-4" aria-hidden /> New issue
            </button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 md:px-6">
        <h1 className="sr-only">{view?.name ?? "Issues"}</h1>
        {view ? (
          <span className="text-[13px] font-medium" aria-hidden>
            {view.name}
          </span>
        ) : (
          <div role="tablist" className="flex gap-1">
            {(Object.keys(scopes) as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
                className={cx(
                  "h-7 rounded-md border px-2.5 text-[13px] font-medium",
                  t.focus,
                  scope === s
                    ? "border-slate-300 bg-slate-100"
                    : "border-transparent text-slate-500 hover:bg-slate-50",
                )}
              >
                {scopes[s].label}
              </button>
            ))}
          </div>
        )}
        <span
          className="ml-auto text-xs text-slate-500 tabular-nums"
          data-testid="issue-count"
        >
          {shown.length} issues
        </span>
        <FilterButton
          teamId={teamId}
          filters={filters}
          setFilters={setFilters}
        />
        <DisplayButton display={display} setDisplay={setDisplay} />
        {!v && !view && (
          <button
            type="button"
            className={t.chip}
            onClick={() => setSaving(true)}
            data-testid="save-view"
            disabled={!filters.some((f) => f.values.length)}
          >
            Save view
          </button>
        )}
        <Menu
          label="View actions"
          trigger={<MoreHorizontal className="size-4" aria-hidden />}
          triggerClassName={t.ghost}
          testId="view-actions"
          items={[
            ...(v && !view
              ? [
                  {
                    label: "Save as view",
                    testId: "menu-save-view",
                    onSelect: () => setSaving(true),
                  },
                ]
              : []),
            { label: "Copy link", onSelect: () => toast("Link copied") },
            {
              label: "Reset filters and display",
              onSelect: () => {
                setFilters(view?.filters ?? []);
                setDisplay(view?.display ?? defaultDisplay);
              },
            },
            ...(view
              ? [
                  {
                    label: "Delete view",
                    danger: true,
                    onSelect: () => {
                      deleteView(view.id);
                      navigate(`/team/${teamId}/issues`);
                    },
                  },
                ]
              : []),
          ]}
        />
      </div>
      <FilterChips teamId={teamId} filters={filters} setFilters={setFilters} />
      <IssueCollection issues={shown} display={display} teamId={teamId} />
      <SaveViewDialog
        open={saving}
        onClose={() => setSaving(false)}
        onSave={save}
      />
    </div>
  );
}

export function TeamIssues() {
  const { teamId = "" } = useParams();
  if (!teams.some((x) => x.id === teamId)) return <Navigate to="/" replace />;
  return <IssuesWorkspace key={teamId} teamId={teamId} />;
}

export function SavedViewPage() {
  const { teamId = "", viewId } = useParams();
  const { views } = useStore();
  const view = views.find((x) => x.id === viewId && x.teamId === teamId);
  if (!view) return <Navigate to={`/team/${teamId}/issues`} replace />;
  return <IssuesWorkspace key={view.id} teamId={teamId} view={view} />;
}

export function ViewsPage() {
  const { teamId = "" } = useParams();
  const { views } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/" replace />;
  const own = views.filter((x) => x.teamId === teamId);
  return (
    <div>
      <Header
        crumbs={[
          { label: team.name, to: `/team/${teamId}/issues` },
          { label: "Views" },
        ]}
      />
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold">Views</h1>
        <p className="mt-1 text-sm text-slate-500">
          Saved filters and layouts for {team.name}. Save one from the issues
          list.
        </p>
        <ul
          data-testid="views-list"
          className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200"
        >
          {own.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No views yet. Filter the issues list, then choose Save as view
              from its menu.
            </li>
          )}
          {own.map((x) => (
            <li key={x.id}>
              <Link
                to={`/team/${teamId}/views/${x.id}`}
                className={cx(
                  "flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50",
                  t.focus,
                )}
              >
                <Layers className="size-4 text-slate-400" aria-hidden />
                <span className="flex-1 font-medium">{x.name}</span>
                <span className="text-xs text-slate-500">
                  {x.filters.filter((f) => f.values.length).length} filters,{" "}
                  {x.display.layout}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MyIssues() {
  const { issues, statusOf } = useStore();
  const [tab, setTab] = useState<"assigned" | "subscribed">("assigned");
  const [display, setDisplay] = useState<Display>(defaultDisplay);
  const mine = issues.filter((i) => {
    const c = statusOf(i)?.category;
    return (
      (tab === "assigned"
        ? i.assigneeId === me
        : i.projectId === "fleet-v2" && i.assigneeId !== me) &&
      c !== "canceled" &&
      c !== "triage"
    );
  });
  return (
    <div className="flex min-h-full flex-col">
      <Header crumbs={[{ label: "My issues" }]} />
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 md:px-6">
        <h1 className="sr-only">My issues</h1>
        <div role="tablist" className="flex gap-1">
          {(["assigned", "subscribed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={cx(
                "h-7 rounded-md border px-2.5 text-[13px] font-medium",
                t.focus,
                tab === s
                  ? "border-slate-300 bg-slate-100"
                  : "border-transparent text-slate-500 hover:bg-slate-50",
              )}
            >
              {s === "assigned" ? "Assigned" : "Subscribed"}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500 tabular-nums">
          {mine.length} issues
        </span>
        <DisplayButton display={display} setDisplay={setDisplay} />
      </div>
      <IssueCollection issues={mine} display={display} teamId="eng" />
    </div>
  );
}
