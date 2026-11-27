import {
  Building2,
  ChevronRight,
  GitBranch,
  Inbox,
  type LucideIcon,
  Plus,
  RefreshCcw,
  Tag,
  Users,
  Workflow,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Avatar } from "../../kit";
import { cx, Dialog } from "../../ui";
import { labels, people, teams } from "./data";
import type { StatusCategory } from "./model";
import { Header, StatusIcon, t } from "./parts";
import { useStore } from "./store";

function LinkList({
  items,
}: {
  items: {
    to: string;
    label: string;
    description: string;
    Icon: LucideIcon;
    testId?: string;
  }[];
}) {
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {items.map(({ to, label, description, Icon, testId }) => (
        <li key={to}>
          <Link
            to={to}
            data-testid={testId}
            className={cx(
              "flex items-center gap-3 px-4 py-3 hover:bg-slate-50",
              t.focus,
            )}
          >
            <Icon className="size-4 text-slate-400" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-slate-500">
                {description}
              </span>
            </span>
            <ChevronRight className="size-4 text-slate-300" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Shell({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: { label: string; to?: string }[];
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Header crumbs={[{ label: "Settings", to: "/settings" }, ...crumbs]} />
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
        <div className="mt-6 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

export function SettingsHome() {
  return (
    <Shell
      crumbs={[]}
      title="Settings"
      description="Workspace and team settings for Halden Robotics."
    >
      <LinkList
        items={[
          {
            to: "/settings/workspace",
            label: "Workspace",
            description: "Name, URL and default team",
            Icon: Building2,
            testId: "settings-workspace",
          },
          {
            to: "/settings/members",
            label: "Members",
            description: "Who has access and their roles",
            Icon: Users,
            testId: "settings-members",
          },
          {
            to: "/settings/labels",
            label: "Labels",
            description: "Labels shared by every team",
            Icon: Tag,
            testId: "settings-labels",
          },
          {
            to: "/settings/teams",
            label: "Teams",
            description: "Workflows, cycles and triage for each team",
            Icon: GitBranch,
            testId: "settings-teams",
          },
        ]}
      />
    </Shell>
  );
}

export function WorkspaceSettings() {
  const { toast } = useStore();
  const [name, setName] = useState("Halden Robotics");
  return (
    <Shell crumbs={[{ label: "Workspace" }]} title="Workspace">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast("Workspace saved");
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Workspace name</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">URL</span>
          <input
            className={cx(t.input, "mt-1.5")}
            defaultValue="corvid.app/halden"
          />
        </label>
        <div>
          <button type="submit" className={t.primary} disabled={!name.trim()}>
            Save workspace
          </button>
        </div>
      </form>
    </Shell>
  );
}

export function MembersSettings() {
  return (
    <Shell
      crumbs={[{ label: "Members" }]}
      title="Members"
      description={`${people.length} members`}
    >
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <Avatar name={p.name} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{p.name}</span>
              <span className="block truncate text-xs text-slate-500">
                {p.email}
              </span>
            </span>
            <span className="text-xs text-slate-500">
              {p.id === "maya" || p.id === "priya" ? "Admin" : "Member"}
            </span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function LabelsSettings() {
  const { issues } = useStore();
  return (
    <Shell crumbs={[{ label: "Labels" }]} title="Labels">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {labels.map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: l.color }}
            />
            <span className="flex-1 font-medium">{l.name}</span>
            <span className="text-xs text-slate-500 tabular-nums">
              {issues.filter((i) => i.labelIds.includes(l.id)).length} issues
            </span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function TeamsSettings() {
  return (
    <Shell crumbs={[{ label: "Teams" }]} title="Teams">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {teams.map((team) => (
          <li key={team.id}>
            <Link
              to={`/settings/teams/${team.id}`}
              data-testid={`settings-team-${team.id}`}
              className={cx(
                "flex items-center gap-3 px-4 py-3 hover:bg-slate-50",
                t.focus,
              )}
            >
              <span
                className="grid size-7 place-items-center rounded-md text-[11px] font-semibold text-white"
                style={{ background: team.color }}
              >
                {team.key}
              </span>
              <span className="flex-1 text-sm font-medium">{team.name}</span>
              <span className="text-xs text-slate-500">
                {team.members.length} members
              </span>
              <ChevronRight className="size-4 text-slate-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function TeamSettings() {
  const { teamId = "" } = useParams();
  const { v, toast } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/settings/teams" replace />;
  return (
    <Shell
      crumbs={[{ label: "Teams", to: "/settings/teams" }, { label: team.name }]}
      title={team.name}
      description={`Issue keys start with ${team.key}.`}
    >
      <LinkList
        items={[
          v
            ? {
                to: `/settings/teams/${teamId}/statuses`,
                label: "Issue statuses",
                description:
                  "Statuses issues move through, grouped by category",
                Icon: Workflow,
                testId: "team-statuses",
              }
            : {
                to: `/settings/teams/${teamId}/workflow`,
                label: "Workflow",
                description: "Issue statuses and automations",
                Icon: Workflow,
                testId: "team-workflow",
              },
          {
            to: `/settings/teams/${teamId}/cycles`,
            label: "Cycles",
            description: "Cycle length, start day and cooldown",
            Icon: RefreshCcw,
            testId: "team-cycles",
          },
          {
            to: `/settings/teams/${teamId}/triage`,
            label: "Triage",
            description: "Where new issues from other teams land",
            Icon: Inbox,
            testId: "team-triage",
          },
        ]}
      />
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm">
        <span className="flex-1">
          Auto-close parent issues when every sub-issue is done
        </span>
        <input
          type="checkbox"
          role="switch"
          defaultChecked
          className="size-4 accent-[#3046C5]"
          onChange={(e) =>
            toast(
              e.target.checked
                ? "Auto-close turned on"
                : "Auto-close turned off",
            )
          }
          aria-label="Auto-close parent issues"
        />
      </div>
    </Shell>
  );
}

const categories: { id: StatusCategory; label: string; hint: string }[] = [
  { id: "triage", label: "Triage", hint: "New issues waiting for review" },
  { id: "backlog", label: "Backlog", hint: "Not planned yet" },
  { id: "unstarted", label: "Unstarted", hint: "Planned, not started" },
  { id: "started", label: "Started", hint: "Someone is working on it" },
  { id: "completed", label: "Completed", hint: "Finished" },
  { id: "canceled", label: "Canceled", hint: "Won't be done" },
];

function StatusDialog({
  teamId,
  category,
  open,
  onClose,
}: {
  teamId: string;
  category: StatusCategory | null;
  open: boolean;
  onClose: () => void;
}) {
  const { addStatus, statuses } = useStore();
  const [name, setName] = useState("");
  const [cat, setCat] = useState<StatusCategory>("started");
  const [touched, setTouched] = useState(false);
  const chosen = category ?? cat;
  const clean = name.trim();
  const error = !clean
    ? "Enter a status name"
    : statuses[teamId].some((s) => s.name.toLowerCase() === clean.toLowerCase())
      ? `${clean} already exists`
      : "";
  const close = () => {
    setName("");
    setTouched(false);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={
        category
          ? `New ${categories.find((c) => c.id === category)?.label.toLowerCase()} status`
          : "New status"
      }
      className={t.dialog}
    >
      <form
        className="mt-3 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (error) return;
          addStatus(teamId, clean, chosen);
          close();
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Name</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="In review"
            aria-invalid={touched && !!error}
            data-testid="status-name"
          />
        </label>
        {touched && error && <p className="text-sm text-rose-600">{error}</p>}
        {!category && (
          <label className="text-sm">
            <span className="font-medium">Category</span>
            <select
              className={cx(t.input, "mt-1.5")}
              value={cat}
              onChange={(e) => setCat(e.target.value as StatusCategory)}
              data-testid="status-category"
            >
              {categories
                .filter((c) => c.id !== "triage")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={t.primary} data-testid="save-status">
            Add status
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function WorkflowSettings() {
  const { teamId = "" } = useParams();
  const { statuses, issues, v } = useStore();
  const [adding, setAdding] = useState<{
    category: StatusCategory | null;
  } | null>(null);
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/settings/teams" replace />;
  const title = v ? "Issue statuses" : "Workflow";
  return (
    <Shell
      crumbs={[
        { label: "Teams", to: "/settings/teams" },
        { label: team.name, to: `/settings/teams/${teamId}` },
        { label: title },
      ]}
      title={title}
      description="Issues move through these statuses from left to right on the board."
    >
      {!v && (
        <div>
          <button
            type="button"
            className={t.primary}
            onClick={() => setAdding({ category: null })}
            data-testid="add-status"
          >
            <Plus className="size-4" aria-hidden /> Add status
          </button>
        </div>
      )}
      {categories.map((c) => {
        const list = statuses[teamId].filter((s) => s.category === c.id);
        return (
          <section key={c.id}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">{c.label}</h2>
                <p className="text-xs text-slate-500">{c.hint}</p>
              </div>
              {v && c.id !== "triage" && (
                <button
                  type="button"
                  className={t.ghost}
                  aria-label={`Add ${c.label.toLowerCase()} status`}
                  onClick={() => setAdding({ category: c.id })}
                  data-testid={`add-status-${c.id}`}
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              )}
            </div>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <StatusIcon category={s.category} />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {
                      issues.filter(
                        (i) => i.teamId === teamId && i.statusId === s.id,
                      ).length
                    }{" "}
                    issues
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <StatusDialog
        teamId={teamId}
        category={adding?.category ?? null}
        open={adding !== null}
        onClose={() => setAdding(null)}
      />
    </Shell>
  );
}

export function CycleSettings() {
  const { teamId = "" } = useParams();
  const { toast } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/settings/teams" replace />;
  return (
    <Shell
      crumbs={[
        { label: "Teams", to: "/settings/teams" },
        { label: team.name, to: `/settings/teams/${teamId}` },
        { label: "Cycles" },
      ]}
      title="Cycles"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast("Cycle settings saved");
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Cycle length</span>
          <select className={cx(t.input, "mt-1.5")} defaultValue="2">
            <option value="1">1 week</option>
            <option value="2">2 weeks</option>
            <option value="3">3 weeks</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium">Starts on</span>
          <select className={cx(t.input, "mt-1.5")} defaultValue="Monday">
            <option>Monday</option>
            <option>Wednesday</option>
          </select>
        </label>
        <div>
          <button type="submit" className={t.primary}>
            Save cycle settings
          </button>
        </div>
      </form>
    </Shell>
  );
}

export function TriageSettings() {
  const { teamId = "" } = useParams();
  const { toast } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/settings/teams" replace />;
  return (
    <Shell
      crumbs={[
        { label: "Teams", to: "/settings/teams" },
        { label: team.name, to: `/settings/teams/${teamId}` },
        { label: "Triage" },
      ]}
      title="Triage"
    >
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm">
        <span className="flex-1">
          Send issues created by other teams to triage
        </span>
        <input
          type="checkbox"
          role="switch"
          defaultChecked
          className="size-4 accent-[#3046C5]"
          onChange={(e) =>
            toast(e.target.checked ? "Triage turned on" : "Triage turned off")
          }
        />
      </label>
    </Shell>
  );
}
