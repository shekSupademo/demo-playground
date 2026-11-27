import { ChevronRight, CircleDashed, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar, useDocumentTitle } from "../../kit";
import { cx, Menu } from "../../ui";
import { cycles, labels, people, teams } from "./data";
import {
  type Issue,
  priorities,
  priorityLabel,
  type Status,
  type StatusCategory,
} from "./model";
import { useStore } from "./store";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3046C5]";

export const t = {
  focus,
  page: "bg-white text-slate-900",
  muted: "text-slate-500",
  link: cx("font-medium text-[#3046C5] hover:underline", focus),
  primary: cx(
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#3046C5] px-3 text-[13px] font-medium text-white shadow-sm hover:bg-[#25389F] disabled:cursor-not-allowed disabled:opacity-50",
    focus,
  ),
  secondary: cx(
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50",
    focus,
  ),
  chip: cx(
    "inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50",
    focus,
  ),
  ghost: cx(
    "inline-grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    focus,
  ),
  input:
    "w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-[#3046C5] focus:outline-2 focus:outline-[#3046C5]/20 aria-invalid:border-rose-500",
  panel: "rounded-lg border border-slate-200 bg-white",
  dialog: "w-full max-w-lg rounded-xl bg-white p-5 text-slate-900 shadow-2xl",
  menuTrigger: cx(
    "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-slate-100",
    focus,
  ),
};

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#141B3D" />
      <path
        d="M9 21.5 16 9l7 12.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19" r="2.6" fill="#7D8CFF" />
    </svg>
  );
}

const categoryColor: Record<StatusCategory, string> = {
  triage: "#C2410C",
  backlog: "#94A3B8",
  unstarted: "#64748B",
  started: "#D97706",
  completed: "#3046C5",
  canceled: "#94A3B8",
};

export function StatusIcon({
  category,
  size = 14,
}: {
  category: StatusCategory;
  size?: number;
}) {
  const c = categoryColor[category];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      aria-hidden
      className="shrink-0"
    >
      {category === "backlog" || category === "triage" ? (
        <circle
          cx="7"
          cy="7"
          r="5.5"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeDasharray={category === "backlog" ? "2 1.6" : undefined}
        />
      ) : category === "unstarted" ? (
        <circle
          cx="7"
          cy="7"
          r="5.5"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      ) : category === "started" ? (
        <>
          <circle
            cx="7"
            cy="7"
            r="5.5"
            fill="none"
            stroke={c}
            strokeWidth="1.5"
          />
          <path d="M7 3.5a3.5 3.5 0 0 1 0 7Z" fill={c} />
        </>
      ) : category === "completed" ? (
        <>
          <circle cx="7" cy="7" r="6.25" fill={c} />
          <path
            d="m4.3 7.2 1.8 1.8 3.6-3.8"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="6.25" fill={c} />
          <path
            d="m5 5 4 4m0-4-4 4"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export function PriorityIcon({ value }: { value: number }) {
  if (value === 1)
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden
        className="shrink-0"
      >
        <rect width="14" height="14" rx="3" fill="#E11D48" />
        <path
          d="M7 3.5v4.2M7 10.2v.1"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  if (value === 0)
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M2.5 7h2m2.5 0h0m2.5 0h2"
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  const filled = value === 2 ? 3 : value === 3 ? 2 : 1;
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden
      className="shrink-0"
    >
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 4}
          y={9 - i * 3}
          width="3"
          height={3.5 + i * 3}
          rx="1"
          fill={i < filled ? "#475569" : "#CBD5E1"}
        />
      ))}
    </svg>
  );
}

export function LabelPill({ id }: { id: string }) {
  const label = labels.find((l) => l.id === id);
  if (!label) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
      <span
        className="size-2 rounded-full"
        style={{ background: label.color }}
      />
      {label.name}
    </span>
  );
}

export const personName = (id: string | null) =>
  people.find((p) => p.id === id)?.name ?? "No assignee";

export function StatusMenu({
  issue,
  withLabel = false,
}: {
  issue: Issue;
  withLabel?: boolean;
}) {
  const { statuses, statusOf, updateIssue } = useStore();
  const current = statusOf(issue);
  return (
    <Menu
      label={`Change status of ${issue.key}, now ${current?.name}`}
      trigger={
        <>
          <StatusIcon category={current?.category ?? "backlog"} />
          {withLabel && <span>{current?.name}</span>}
        </>
      }
      triggerClassName={t.menuTrigger}
      testId={withLabel ? "prop-status" : undefined}
      items={statuses[issue.teamId].map((s: Status) => ({
        label: s.name,
        testId: `set-status-${s.id}`,
        onSelect: () =>
          s.id !== issue.statusId &&
          updateIssue(
            issue.id,
            { statusId: s.id },
            `changed status to ${s.name}`,
          ),
      }))}
    />
  );
}

export function PriorityMenu({
  issue,
  withLabel = false,
}: {
  issue: Issue;
  withLabel?: boolean;
}) {
  const { updateIssue } = useStore();
  return (
    <Menu
      label={`Change priority of ${issue.key}, now ${priorityLabel(issue.priority)}`}
      trigger={
        <>
          <PriorityIcon value={issue.priority} />
          {withLabel && <span>{priorityLabel(issue.priority)}</span>}
        </>
      }
      triggerClassName={t.menuTrigger}
      testId={withLabel ? "prop-priority" : undefined}
      items={priorities.map((p) => ({
        label: p.label,
        testId: `set-priority-${p.value}`,
        onSelect: () =>
          updateIssue(
            issue.id,
            { priority: p.value },
            `set priority to ${p.label}`,
          ),
      }))}
    />
  );
}

export function AssigneeMenu({
  issue,
  withLabel = false,
}: {
  issue: Issue;
  withLabel?: boolean;
}) {
  const { updateIssue } = useStore();
  const members = teams.find((x) => x.id === issue.teamId)?.members ?? [];
  const team = people.filter((p) => members.includes(p.id));
  return (
    <Menu
      label={`Assign ${issue.key}, now ${personName(issue.assigneeId)}`}
      trigger={
        <>
          {issue.assigneeId ? (
            <Avatar name={personName(issue.assigneeId)} size={20} />
          ) : (
            <CircleDashed className="size-5 text-slate-400" aria-hidden />
          )}
          {withLabel && <span>{personName(issue.assigneeId)}</span>}
        </>
      }
      triggerClassName={cx(t.menuTrigger, !withLabel && "rounded-full p-0.5")}
      testId={withLabel ? "prop-assignee" : undefined}
      items={[
        {
          label: "No assignee",
          testId: "set-assignee-none",
          onSelect: () =>
            updateIssue(issue.id, { assigneeId: null }, "removed the assignee"),
        },
        ...team.map((p) => ({
          label: p.name,
          testId: `set-assignee-${p.id}`,
          onSelect: () =>
            updateIssue(
              issue.id,
              { assigneeId: p.id },
              `assigned the issue to ${p.name}`,
            ),
        })),
      ]}
    />
  );
}

export function LabelsMenu({ issue }: { issue: Issue }) {
  const { updateIssue } = useStore();
  return (
    <Menu
      label={`Add or remove labels on ${issue.key}`}
      trigger={
        issue.labelIds.length ? (
          <span className="flex flex-wrap gap-1">
            {issue.labelIds.map((id) => (
              <LabelPill key={id} id={id} />
            ))}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <Tag className="size-3.5" aria-hidden /> Add label
          </span>
        )
      }
      triggerClassName={t.menuTrigger}
      testId="prop-labels"
      items={labels.map((l) => {
        const has = issue.labelIds.includes(l.id);
        return {
          label: has ? `Remove ${l.name}` : `Add ${l.name}`,
          testId: `toggle-label-${l.id}`,
          onSelect: () =>
            updateIssue(
              issue.id,
              {
                labelIds: has
                  ? issue.labelIds.filter((x) => x !== l.id)
                  : [...issue.labelIds, l.id],
              },
              has ? `removed the ${l.name} label` : `added the ${l.name} label`,
            ),
        };
      })}
    />
  );
}

export function CycleMenu({ issue }: { issue: Issue }) {
  const { updateIssue, toast } = useStore();
  const current = cycles.find((c) => c.id === issue.cycleId);
  const options = cycles.filter(
    (c) =>
      c.teamId === issue.teamId &&
      c.end >= new Date().toISOString().slice(0, 10),
  );
  return (
    <Menu
      label={`Change cycle of ${issue.key}, now ${current ? `Cycle ${current.number}` : "no cycle"}`}
      trigger={
        <span className={current ? "" : "text-slate-500"}>
          {current ? `Cycle ${current.number}` : "Add to cycle"}
        </span>
      }
      triggerClassName={t.menuTrigger}
      testId="prop-cycle"
      items={[
        ...options.map((c) => ({
          label: `Cycle ${c.number}`,
          testId: `set-cycle-${c.id}`,
          onSelect: () => {
            updateIssue(
              issue.id,
              { cycleId: c.id },
              `added the issue to Cycle ${c.number}`,
            );
            toast(`${issue.key} added to Cycle ${c.number}`);
          },
        })),
        {
          label: "No cycle",
          testId: "set-cycle-none",
          onSelect: () =>
            updateIssue(
              issue.id,
              { cycleId: null },
              "removed the issue from its cycle",
            ),
        },
      ]}
    />
  );
}

export function ProjectMenu({ issue }: { issue: Issue }) {
  const { projects, updateIssue } = useStore();
  const current = projects.find((p) => p.id === issue.projectId);
  return (
    <Menu
      label={`Change project of ${issue.key}`}
      trigger={
        <span className={cx("truncate", !current && "text-slate-500")}>
          {current?.name ?? "Add to project"}
        </span>
      }
      triggerClassName={cx(t.menuTrigger, "max-w-full")}
      testId="prop-project"
      items={[
        ...projects.map((p) => ({
          label: p.name,
          testId: `set-project-${p.id}`,
          onSelect: () =>
            updateIssue(
              issue.id,
              { projectId: p.id, milestoneId: null },
              `moved the issue to ${p.name}`,
            ),
        })),
        {
          label: "No project",
          testId: "set-project-none",
          onSelect: () =>
            updateIssue(
              issue.id,
              { projectId: null, milestoneId: null },
              "removed the project",
            ),
        },
      ]}
    />
  );
}

export function MilestoneMenu({ issue }: { issue: Issue }) {
  const { milestones, updateIssue } = useStore();
  const options = milestones.filter((m) => m.projectId === issue.projectId);
  const current = milestones.find((m) => m.id === issue.milestoneId);
  return (
    <Menu
      label={`Change milestone of ${issue.key}`}
      trigger={
        <span className={current ? "" : "text-slate-500"}>
          {current?.name ?? "Add milestone"}
        </span>
      }
      triggerClassName={t.menuTrigger}
      testId="prop-milestone"
      items={[
        ...options.map((m) => ({
          label: m.name,
          testId: `set-milestone-${m.id}`,
          onSelect: () =>
            updateIssue(
              issue.id,
              { milestoneId: m.id },
              `set the milestone to ${m.name}`,
            ),
        })),
        {
          label: "No milestone",
          onSelect: () =>
            updateIssue(
              issue.id,
              { milestoneId: null },
              "removed the milestone",
            ),
        },
      ]}
    />
  );
}

export type Crumb = { label: string; to?: string; testId?: string };

export function Header({
  crumbs,
  actions,
}: {
  crumbs: Crumb[];
  actions?: ReactNode;
}) {
  useDocumentTitle(`${crumbs.at(-1)?.label ?? "Corvid"} – Corvid`);
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-2 md:px-6">
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 text-[13px] text-slate-500">
          {crumbs.map((c, i) => (
            <li
              key={`${c.label}-${i}`}
              className="flex min-w-0 items-center gap-1"
            >
              {i > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-slate-400"
                  aria-hidden
                />
              )}
              {c.to ? (
                <Link
                  to={c.to}
                  data-testid={c.testId}
                  className={cx(
                    "truncate rounded px-1 hover:bg-slate-100 hover:text-slate-900",
                    focus,
                  )}
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="truncate px-1 font-medium text-slate-900"
                >
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export function useTab<T extends string>(tabs: readonly T[]) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const current = tabs.find((tab) => tab === raw) ?? tabs[0];
  return [
    current,
    (tab: T) => setParams(tab === tabs[0] ? {} : { tab }),
  ] as const;
}

export function Tabs<T extends string>({
  tabs,
  current,
  onChange,
  labels: names,
}: {
  tabs: readonly T[];
  current: T;
  onChange: (tab: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === current}
          data-testid={`tab-${tab}`}
          onClick={() => onChange(tab)}
          className={cx(
            "h-7 shrink-0 rounded-md px-2.5 text-[13px] font-medium",
            focus,
            tab === current
              ? "bg-slate-100 text-slate-900"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
          )}
        >
          {names[tab]}
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({
  pct,
  size = 16,
}: {
  pct: number;
  size?: number;
}) {
  const r = size / 2 - 2;
  const len = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#3046C5"
        strokeWidth="2"
        strokeDasharray={`${(pct / 100) * len} ${len}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress"
    >
      <div
        className="h-full rounded-full bg-[#3046C5]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PropRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
