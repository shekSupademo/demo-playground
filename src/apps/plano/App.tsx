import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  Briefcase,
  ChevronRight,
  ChevronsUpDown,
  Folder,
  HelpCircle,
  Home as HomeIcon,
  Link2,
  Loader2,
  Megaphone,
  Plus,
  Search,
  SearchX,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Avatar,
  daysFromToday,
  EmptyState,
  formatDate,
  MobileNav,
  NotificationsMenu,
  relativeTime,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import {
  type Activity,
  type ActivityKind,
  byNewest,
  hoursAgo,
  ME,
  type Project,
  people,
  progressOf,
  type Status,
  seed,
  statusOf,
  type Task,
} from "./data";

function copyFor(v: boolean) {
  const projects = v ? "Workspaces" : "Projects";
  const project = v ? "workspace" : "project";
  return {
    projects,
    project,
    homeHeading: v ? "Your week" : "Overview",
    homeBody: v
      ? "Plan, track, and ship work with your team."
      : "Track every project in one place.",
    dueSoon: v ? "Workspaces due soon" : "Projects due soon",
    dueTooltip: v ? "Due in the next 7 days" : "Projects due this week",
    viewAll: v ? "View all workspaces" : "View all projects",
    myTasks: "My tasks",
    completed: "Completed tasks",
    activity: "Recent activity",
    search: v ? "Find a workspace, task, or person" : "Search projects",
    listBody: v
      ? "Every workspace your team is running, with owners, progress and due dates."
      : "Every project your team is running, with owners, progress and due dates.",
    newProject: v ? "New workspace" : "New project",
    createProject: v ? "Create workspace" : "Create project",
    nameLabel: v ? "Workspace name" : "Project name",
    nameError: v ? "Give your workspace a name" : "Name is required",
    created: v ? "Workspace ready" : "Project created",
    addTask: v ? "Create task" : "Add task",
    taskPlaceholder: "Task title",
    emptyTitle: v ? "Nothing archived yet" : "No archived projects",
    emptyBody: v
      ? "Archive a workspace when the work is done to keep your list tidy. You can restore it at any time."
      : "Archived projects appear here.",
    archive: v ? "Archive workspace" : "Archive project",
    restore: v ? "Restore workspace" : "Restore project",
    archived: v ? "Workspace archived" : "Project archived",
    restored: v ? "Workspace restored" : "Project restored",
    archivedBanner: v
      ? "This workspace is archived. Restore it to add or edit tasks."
      : "This project is archived. Restore it to add or edit tasks.",
    activeCount: v ? "Active workspaces" : "Active projects",
    share: "Share",
    linkCopied: "Link copied",
    details: v
      ? {
          title: "Projektdetails",
          owner: "Verantwortliche Person",
          start: "Startdatum",
          due: "Fälligkeitsdatum",
          priority: "Priorität",
          progress: "Fortschritt",
          progressValue: (done: number, total: number) =>
            `${done} von ${total} Aufgaben erledigt`,
          priorities: { high: "Hoch", medium: "Mittel", low: "Niedrig" },
          markDone: "Alle Aufgaben als erledigt markieren",
          locale: "de-DE",
        }
      : {
          title: "Project details",
          owner: "Owner",
          start: "Start date",
          due: "Due date",
          priority: "Priority",
          progress: "Progress",
          progressValue: (done: number, total: number) =>
            `${done} of ${total} tasks done`,
          priorities: { high: "High", medium: "Medium", low: "Low" },
          markDone: "Mark all tasks done",
          locale: "en-US",
        },
  };
}

type Copy = ReturnType<typeof copyFor>;

const sans = "[font-family:Figtree,ui-sans-serif,system-ui,sans-serif]";
const serif = "[font-family:Fraunces,Georgia,serif]";

function styleFor(v: boolean) {
  return v
    ? {
        root: "dark bg-zinc-950 text-zinc-100 [color-scheme:dark] [&_[popover]]:border-zinc-800 [&_[popover]]:bg-zinc-900 [&_[popover]]:text-zinc-100 [&_[popover]_button:hover]:bg-zinc-800 [&_[popover]_button:focus-visible]:bg-zinc-800 [&_[popover]_.border-zinc-100]:border-zinc-800 [&_[popover]_.text-zinc-600]:text-zinc-300 [&_[popover]_.text-zinc-500]:text-zinc-400 [&_.ring-white]:ring-zinc-950",
        sidebar: "border-zinc-800 bg-zinc-900/50",
        topbar: "border-zinc-800 bg-zinc-950",
        main: "px-4 py-8 sm:px-10 sm:py-10",
        panel: "rounded-2xl border border-zinc-800 bg-zinc-900 animate-fade-up",
        pad: "p-6",
        gap: "gap-6",
        stack: "space-y-8",
        heading: `${serif} text-4xl font-medium tracking-tight`,
        subheading: `${serif} text-xl font-medium`,
        muted: "text-zinc-400",
        subtle: "text-zinc-300",
        border: "border-zinc-800",
        divide: "divide-zinc-800",
        rowHover: "hover:bg-zinc-800/50",
        cell: "px-5 py-4",
        primary:
          "rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60",
        secondary:
          "rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
        iconBtn:
          "rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
        input:
          "rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25",
        ring: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400",
        accentText: "text-emerald-400",
        accentBg: "bg-emerald-500",
        track: "bg-zinc-800",
        navActive: "bg-emerald-500/15 text-emerald-300",
        navIdle: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
        navItem: "rounded-xl px-3 py-2.5",
        count: "bg-zinc-800 text-zinc-300",
        check: "accent-emerald-500",
        danger: "text-rose-400",
        invalid: "border-rose-400",
        tooltip: "bg-zinc-100 text-zinc-900",
        banner:
          "rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200",
        dialog:
          "w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl animate-slide-in",
        dialogTitle: `${serif} text-2xl font-medium`,
        mobileNav: "border-r border-zinc-800 bg-zinc-900 text-zinc-100",
        empty:
          "[&_.bg-zinc-100]:bg-emerald-500/10 [&_.bg-zinc-100]:text-emerald-400 [&_.text-zinc-500]:text-zinc-400",
        toast: "bg-emerald-600 text-white",
        tones: {
          onTrack: "bg-emerald-500/10 text-emerald-300",
          atRisk: "bg-amber-500/10 text-amber-300",
          overdue: "bg-rose-500/10 text-rose-300",
          complete: "bg-zinc-800 text-zinc-300",
        } as Record<Status, string>,
        ProjectIcon: Briefcase,
        SettingsIcon: SlidersHorizontal,
      }
    : {
        root: "bg-zinc-50 text-zinc-900",
        sidebar: "border-zinc-200 bg-white",
        topbar: "border-zinc-200 bg-white",
        main: "px-4 py-6 sm:px-6",
        panel: "rounded-md border border-zinc-200 bg-white shadow-xs",
        pad: "p-4",
        gap: "gap-4",
        stack: "space-y-5",
        heading: "text-xl font-semibold tracking-tight",
        subheading: "text-sm font-semibold",
        muted: "text-zinc-500",
        subtle: "text-zinc-600",
        border: "border-zinc-200",
        divide: "divide-zinc-100",
        rowHover: "hover:bg-zinc-50",
        cell: "px-3 py-2.5",
        primary:
          "rounded-md bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60",
        secondary:
          "rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50",
        iconBtn:
          "rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
        input:
          "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
        ring: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        accentText: "text-indigo-600",
        accentBg: "bg-indigo-600",
        track: "bg-zinc-100",
        navActive: "bg-indigo-50 text-indigo-700",
        navIdle: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        navItem: "rounded-md px-2.5 py-1.5",
        count: "bg-zinc-100 text-zinc-600",
        check: "accent-indigo-600",
        danger: "text-rose-600",
        invalid: "border-rose-500",
        tooltip: "bg-zinc-900 text-white",
        banner: "rounded-md border border-amber-200 bg-amber-50 text-amber-900",
        dialog:
          "w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl",
        dialogTitle: "text-base font-semibold",
        mobileNav: "bg-white text-zinc-900",
        empty: "",
        toast: "bg-zinc-900 text-white",
        tones: {
          onTrack: "bg-emerald-50 text-emerald-700",
          atRisk: "bg-amber-50 text-amber-800",
          overdue: "bg-rose-50 text-rose-700",
          complete: "bg-zinc-100 text-zinc-600",
        } as Record<Status, string>,
        ProjectIcon: Folder,
        SettingsIcon: Settings,
      };
}

type Style = ReturnType<typeof styleFor>;
type Ctx = { v: boolean; t: Copy; s: Style };

const statusLabel: Record<Status, string> = {
  onTrack: "On track",
  atRisk: "At risk",
  overdue: "Overdue",
  complete: "Complete",
};

const today = () => daysFromToday(0);

function localDate(iso: string, locale: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Logo({ v }: { v: boolean }) {
  return v ? (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#059669" />
      <path
        d="M9.5 22.5C9.5 14.5 15 9.5 23 9.5c0 8-5.5 13-13.5 13Z"
        fill="#fff"
      />
      <path
        d="M9.5 22.5 17 15"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#4F46E5" />
      <path
        d="M11.5 24V8.5h6a5 5 0 0 1 0 10h-6"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusPill({ status, s }: { status: Status; s: Style }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        s.tones[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {statusLabel[status]}
    </span>
  );
}

function Progress({ pct, s, label }: { pct: number; s: Style; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-1.5 w-full overflow-hidden rounded-full", s.track)}
    >
      <div
        className={cx("h-full rounded-full", s.accentBg)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Spinner() {
  return <Loader2 className="size-4 animate-spin" aria-hidden />;
}

function DueText({ due, done, s }: { due: string; done: boolean; s: Style }) {
  const late = !done && due < today();
  return (
    <span
      className={cx(
        "text-xs whitespace-nowrap tabular-nums",
        late ? s.danger : s.muted,
      )}
    >
      {late
        ? `Overdue, ${formatDate(due).replace(/, \d{4}$/, "")}`
        : relativeTime(due)}
    </span>
  );
}

function TaskRow({
  task,
  project,
  onToggle,
  ctx,
  disabled,
}: {
  task: Task;
  project?: Project;
  onToggle: () => void;
  ctx: Ctx;
  disabled?: boolean;
}) {
  const { s, v } = ctx;
  return (
    <li className={cx("flex items-center gap-3", v ? "py-3" : "py-2")}>
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.done}
        onChange={onToggle}
        disabled={disabled}
        className={cx("size-4 shrink-0 cursor-pointer", s.check)}
        data-testid={`task-${task.id}`}
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`task-${task.id}`}
          title={task.title}
          className={cx(
            "block cursor-pointer truncate text-sm",
            task.done && cx(s.muted, "line-through"),
          )}
        >
          {task.title}
        </label>
        {project && (
          <Link
            to={`/projects/${project.id}`}
            title={project.name}
            className={cx(
              "block max-w-full truncate text-xs hover:underline",
              s.muted,
              s.ring,
            )}
          >
            {project.name}
          </Link>
        )}
      </div>
      <DueText due={task.due} done={task.done} s={s} />
      <span title={task.assignee} className="inline-flex">
        <Avatar name={task.assignee} size={22} />
        <span className="sr-only">Assigned to {task.assignee}</span>
      </span>
    </li>
  );
}

function HelpTip({ text, s }: { text: string; s: Style }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        data-testid="due-help"
        className={cx("grid size-6 place-items-center", s.iconBtn, s.ring)}
      >
        <HelpCircle className="size-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className={cx(
          "pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shadow-md group-focus-within:visible group-hover:visible",
          s.tooltip,
        )}
      >
        {text}
      </span>
    </span>
  );
}

function activityText(a: Activity, t: Copy, projectName?: string): ReactNode {
  const strong = (text?: string) => <span className="font-medium">{text}</span>;
  const where = projectName ? <> in {strong(projectName)}</> : null;
  const self = (verb: string) =>
    projectName ? (
      <>
        {verb} {strong(projectName)}
      </>
    ) : (
      `${verb} this ${t.project}`
    );
  const verbs: Record<ActivityKind, ReactNode> = {
    created: self("created"),
    archived: self("archived"),
    restored: self("restored"),
    completed: (
      <>
        completed {strong(a.subject)}
        {where}
      </>
    ),
    reopened: (
      <>
        reopened {strong(a.subject)}
        {where}
      </>
    ),
    addedTask: (
      <>
        added {strong(a.subject)}
        {where}
      </>
    ),
  };
  return verbs[a.kind];
}

function Home({
  ctx,
  projects,
  toggle,
}: {
  ctx: Ctx;
  projects: Project[];
  toggle: (p: string, t: string) => void;
}) {
  const { v, t, s } = ctx;
  useDocumentTitle(`${t.homeHeading} – Plano`);
  const active = projects.filter((p) => !p.archived);
  const mine = active
    .flatMap((p) =>
      p.tasks
        .filter((task) => task.assignee === ME)
        .map((task) => ({ p, task })),
    )
    .sort((a, b) => a.task.due.localeCompare(b.task.due));
  const open = mine.filter(({ task }) => !task.done);
  const done = mine.filter(({ task }) => task.done);
  const week = daysFromToday(7);
  const dueProjects = active
    .filter((p) => statusOf(p) !== "complete")
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  const activity = active
    .flatMap((p) => p.activity.map((a) => ({ a, p })))
    .sort((x, y) => byNewest(x.a, y.a))
    .slice(0, 6);
  const overdue = open.filter(({ task }) => task.due < today()).length;

  const stats = [
    { label: "Open tasks", value: open.length, late: false },
    {
      label: "Due this week",
      value: open.filter(({ task }) => task.due >= today() && task.due <= week)
        .length,
      late: false,
    },
    { label: "Overdue", value: overdue, late: overdue > 0 },
    { label: t.activeCount, value: active.length, late: false },
  ];

  const dueSoon = (
    <section
      key="due"
      className={cx(s.panel, s.pad)}
      data-testid="section-due-soon"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <h2 className={s.subheading}>{t.dueSoon}</h2>
        <HelpTip text={t.dueTooltip} s={s} />
      </div>
      <ul className={cx("divide-y", s.divide)}>
        {dueProjects.map((p) => {
          const { pct } = progressOf(p);
          return (
            <li
              key={p.id}
              className={cx("flex items-center gap-3", v ? "py-3" : "py-2")}
            >
              <s.ProjectIcon
                className={cx("size-4 shrink-0", s.accentText)}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/projects/${p.id}`}
                  title={p.name}
                  className={cx(
                    "block truncate text-sm font-medium hover:underline",
                    s.ring,
                  )}
                >
                  {p.name}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-20">
                    <Progress pct={pct} s={s} label={`${p.name} progress`} />
                  </div>
                  <span className={cx("text-xs tabular-nums", s.muted)}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={statusOf(p)} s={s} />
                <DueText due={p.due} done={false} s={s} />
              </div>
            </li>
          );
        })}
      </ul>
      <Link
        to="/projects"
        className={cx(
          "mt-2 inline-block text-sm font-medium hover:underline",
          s.accentText,
          s.ring,
        )}
      >
        {t.viewAll}
      </Link>
    </section>
  );

  const myTasks = (
    <section
      key="tasks"
      className={cx(s.panel, s.pad)}
      data-testid="section-my-tasks"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className={s.subheading}>{t.myTasks}</h2>
        <span className={cx("text-xs tabular-nums", s.muted)}>
          {open.length} open
        </span>
      </div>
      {open.length === 0 ? (
        <p className={cx("py-6 text-center text-sm", s.muted)}>
          You're all caught up.
        </p>
      ) : (
        <ul className={cx("divide-y", s.divide)}>
          {open.map(({ p, task }) => (
            <TaskRow
              key={task.id}
              task={task}
              project={p}
              ctx={ctx}
              onToggle={() => toggle(p.id, task.id)}
            />
          ))}
        </ul>
      )}
      <details
        open={!v}
        className={cx("group mt-3 border-t pt-3", s.border)}
        data-testid="completed-tasks"
      >
        <summary
          className={cx(
            "flex cursor-pointer list-none items-center gap-1.5 rounded text-sm font-medium [&::-webkit-details-marker]:hidden",
            s.subtle,
            s.ring,
          )}
        >
          <ChevronRight className="size-4 group-open:rotate-90" aria-hidden />
          {t.completed} ({done.length})
        </summary>
        <ul className={cx("mt-1 divide-y", s.divide)}>
          {done.map(({ p, task }) => (
            <TaskRow
              key={task.id}
              task={task}
              project={p}
              ctx={ctx}
              onToggle={() => toggle(p.id, task.id)}
            />
          ))}
        </ul>
      </details>
    </section>
  );

  return (
    <div className={s.stack}>
      <header>
        <h1 className={s.heading}>{t.homeHeading}</h1>
        <p className={cx("mt-1", s.muted)}>{t.homeBody}</p>
      </header>
      {v && (
        <section
          className={cx(
            s.panel,
            s.pad,
            "flex items-start gap-4 border-emerald-800/70 bg-emerald-950/40",
          )}
          data-testid="announcement"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Megaphone className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className={cx(serif, "text-xl font-medium")}>
              Team offsite on{" "}
              {new Date(`${daysFromToday(14)}T12:00:00`).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric" },
              )}
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              Sam Rivera: Add your agenda ideas to the shared doc by Friday, and
              let Priya know about any travel needs.
            </p>
          </div>
        </section>
      )}
      <dl
        className={cx("grid grid-cols-2 sm:grid-cols-4", v ? "gap-6" : "gap-4")}
      >
        {stats.map((stat) => (
          <div key={stat.label} className={cx("border-l-2 pl-3", s.border)}>
            <dt className={cx("text-xs", s.muted)}>{stat.label}</dt>
            <dd
              className={cx(
                "mt-0.5 font-semibold tabular-nums",
                v ? "text-3xl" : "text-2xl",
                stat.late && s.danger,
              )}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className={cx("grid grid-cols-1 items-start lg:grid-cols-2", s.gap)}>
        {v ? [myTasks, dueSoon] : [dueSoon, myTasks]}
      </div>
      {!v && (
        <section className={cx(s.panel, s.pad)} data-testid="recent-activity">
          <h2 className={cx(s.subheading, "mb-2")}>{t.activity}</h2>
          <ul className={cx("divide-y", s.divide)}>
            {activity.map(({ a, p }) => (
              <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                <Avatar name={a.who} size={24} />
                <p className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{a.who}</span>{" "}
                  <span className={s.subtle}>{activityText(a, t, p.name)}</span>
                </p>
                <time
                  dateTime={a.at}
                  className={cx("shrink-0 text-xs", s.muted)}
                >
                  {relativeTime(a.at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type SortKey = "name" | "owner" | "progress" | "due";
type NewProject = {
  name: string;
  owner: string;
  due: string;
  description: string;
};

function Projects({
  ctx,
  projects,
  query,
  setQuery,
  create,
}: {
  ctx: Ctx;
  projects: Project[];
  query: string;
  setQuery: (q: string) => void;
  create: (input: NewProject) => void;
}) {
  const { v, t, s } = ctx;
  useDocumentTitle(`${t.projects} – Plano`);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "due",
    dir: 1,
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [newOwner, setNewOwner] = useState(ME);
  const [due, setDue] = useState(daysFromToday(30));
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();
  const inTab = projects.filter((p) => p.archived === (tab === "archived"));
  const owners = [...new Set(projects.map((p) => p.owner))].sort();
  const compare = (a: Project, b: Project) => {
    if (sort.key === "progress") return progressOf(a).pct - progressOf(b).pct;
    if (sort.key === "owner") return a.owner.localeCompare(b.owner);
    if (sort.key === "name") return a.name.localeCompare(b.name);
    return a.due.localeCompare(b.due);
  };
  const shown = inTab
    .filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.tasks.some((task) => task.title.toLowerCase().includes(q)),
    )
    .filter((p) => !owner || p.owner === owner)
    .filter((p) => !status || statusOf(p) === status)
    .sort((a, b) => compare(a, b) * sort.dir);
  const filtered = Boolean(q || owner || status);

  function openDialog() {
    setName("");
    setNewOwner(ME);
    setDue(daysFromToday(30));
    setDescription("");
    setError("");
    setOpen(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError(t.nameError);
    setError("");
    setBusy(true);
    setTimeout(() => {
      create({
        name: name.trim(),
        owner: newOwner,
        due,
        description: description.trim(),
      });
      setBusy(false);
      setOpen(false);
      setTab("active");
    }, 450);
  }

  function clearFilters() {
    setQuery("");
    setOwner("");
    setStatus("");
  }

  const header = (key: SortKey, label: string, end = false) => {
    const current = sort.key === key;
    const Icon = !current ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th
        scope="col"
        aria-sort={
          current ? (sort.dir === 1 ? "ascending" : "descending") : "none"
        }
        className={cx(s.cell, "font-medium", end ? "text-right" : "text-left")}
      >
        <button
          type="button"
          onClick={() =>
            setSort({ key, dir: current ? (sort.dir === 1 ? -1 : 1) : 1 })
          }
          className={cx(
            "inline-flex items-center gap-1 rounded hover:text-current",
            s.ring,
          )}
        >
          {label}
          <Icon
            className={cx("size-3.5", !current && "opacity-50")}
            aria-hidden
          />
        </button>
      </th>
    );
  };

  return (
    <div className={s.stack}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={s.heading}>{t.projects}</h1>
          <p className={cx("mt-1 text-sm", s.muted)}>{t.listBody}</p>
        </div>
        <button
          type="button"
          className={cx(
            "inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium",
            s.primary,
            s.ring,
          )}
          onClick={openDialog}
          data-testid="new-project"
        >
          <Plus className="size-4" aria-hidden /> {t.newProject}
        </button>
      </header>

      <div
        className={cx(
          "flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b",
          s.border,
        )}
      >
        <div
          role="tablist"
          aria-label={t.projects}
          className="-mb-px flex gap-4"
        >
          {(["active", "archived"] as const).map((value) => {
            const count = projects.filter(
              (p) => p.archived === (value === "archived"),
            ).length;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cx(
                  "inline-flex items-center gap-2 border-b-2 px-1 pb-2.5 text-sm font-medium",
                  tab === value
                    ? cx("border-current", s.accentText)
                    : cx("border-transparent hover:text-current", s.muted),
                  s.ring,
                )}
                data-testid={`tab-${value}`}
              >
                {value === "active" ? "Active" : "Archived"}
                <span
                  className={cx(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    s.count,
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <label className="sr-only" htmlFor="owner-filter">
            Owner
          </label>
          <select
            id="owner-filter"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={cx(s.input, "py-1.5")}
            data-testid="owner-filter"
          >
            <option value="">All owners</option>
            {owners.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "")}
            className={cx(s.input, "py-1.5")}
            data-testid="status-filter"
          >
            <option value="">All statuses</option>
            {(Object.keys(statusLabel) as Status[]).map((key) => (
              <option key={key} value={key}>
                {statusLabel[key]}
              </option>
            ))}
          </select>
          {filtered && (
            <button
              type="button"
              onClick={clearFilters}
              className={cx(
                "px-2 py-1.5 text-sm font-medium",
                s.iconBtn,
                s.ring,
              )}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {inTab.length === 0 && tab === "archived" ? (
        <div className={cx(s.panel, s.empty)} data-testid="empty-state">
          <EmptyState
            icon={
              v ? (
                <Sparkles className="size-6" aria-hidden />
              ) : (
                <Box className="size-5" aria-hidden />
              )
            }
            title={t.emptyTitle}
            body={t.emptyBody}
          />
        </div>
      ) : shown.length === 0 ? (
        <div className={cx(s.panel, s.empty)} data-testid="no-results">
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden />}
            title={
              q
                ? `Nothing matches "${query.trim()}"`
                : `No ${t.projects.toLowerCase()} match these filters`
            }
            body={`Try a different ${t.project} name, owner or task, or clear the filters.`}
            action={
              <button
                type="button"
                onClick={clearFilters}
                className={cx(
                  "px-3 py-1.5 text-sm font-medium",
                  s.secondary,
                  s.ring,
                )}
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className={cx(s.panel, "overflow-hidden")}>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className={cx("border-b text-xs", s.border, s.muted)}>
                <tr>
                  {header("name", "Name")}
                  {header("owner", "Owner")}
                  <th
                    scope="col"
                    className={cx(s.cell, "text-left font-medium")}
                  >
                    Status
                  </th>
                  {header("progress", "Progress")}
                  {header("due", "Due", true)}
                </tr>
              </thead>
              <tbody className={cx("divide-y", s.divide)}>
                {shown.map((p) => {
                  const { pct, done, total } = progressOf(p);
                  const st = statusOf(p);
                  return (
                    <tr
                      key={p.id}
                      className={s.rowHover}
                      data-testid={`project-${p.id}`}
                    >
                      <td className={cx(s.cell, "w-[40%] max-w-0")}>
                        <div className="flex items-center gap-2.5">
                          <s.ProjectIcon
                            className={cx("size-4 shrink-0", s.accentText)}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/projects/${p.id}`}
                              title={p.name}
                              className={cx(
                                "block truncate font-medium hover:underline",
                                s.ring,
                              )}
                            >
                              {p.name}
                            </Link>
                            <p className={cx("truncate text-xs", s.muted)}>
                              {total === 0
                                ? "No tasks yet"
                                : `${done} of ${total} tasks done`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={s.cell}>
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={p.owner} size={22} />
                          {p.owner}
                        </span>
                      </td>
                      <td className={s.cell}>
                        <StatusPill status={st} s={s} />
                      </td>
                      <td className={s.cell}>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress
                              pct={pct}
                              s={s}
                              label={`${p.name} progress`}
                            />
                          </div>
                          <span
                            className={cx(
                              "w-9 text-right text-xs tabular-nums",
                              s.muted,
                            )}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td
                        className={cx(
                          s.cell,
                          "text-right whitespace-nowrap tabular-nums",
                          st === "overdue" ? s.danger : s.subtle,
                        )}
                      >
                        {formatDate(p.due)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p
            className={cx(
              "border-t px-4 py-2.5 text-xs tabular-nums",
              s.border,
              s.muted,
            )}
          >
            Showing {shown.length} of {inTab.length}{" "}
            {tab === "archived" ? "archived" : "active"}{" "}
            {inTab.length === 1 ? t.project : t.projects.toLowerCase()}
          </p>
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={<span className={s.dialogTitle}>{t.newProject}</span>}
        className={s.dialog}
        testId="new-project-dialog"
      >
        <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-name" className="text-sm font-medium">
              {t.nameLabel}
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby="name-error"
              placeholder="For example, Spring launch"
              className={cx(s.input, error && s.invalid)}
              data-testid="project-name"
            />
            <p
              id="name-error"
              className={cx("min-h-5 text-sm", s.danger)}
              data-testid="project-name-error"
            >
              {error}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-owner" className="text-sm font-medium">
                Owner
              </label>
              <select
                id="project-owner"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className={s.input}
              >
                {Object.keys(people).map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-due" className="text-sm font-medium">
                Due date
              </label>
              <input
                id="project-due"
                type="date"
                value={due}
                min={today()}
                onChange={(e) => setDue(e.target.value || daysFromToday(30))}
                className={s.input}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="project-description"
              className="text-sm font-medium"
            >
              Description{" "}
              <span className={cx("font-normal", s.muted)}>(optional)</span>
            </label>
            <textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cx(s.input, "resize-none")}
            />
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              className={cx(
                "px-3.5 py-2 text-sm font-medium",
                s.secondary,
                s.ring,
              )}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cx(
                "inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium",
                s.primary,
                s.ring,
              )}
              data-testid="create-project"
            >
              {busy && <Spinner />}
              {t.createProject}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function ProjectDetail({
  ctx,
  projects,
  toggle,
  addTask,
  completeAll,
  setArchived,
  toast,
}: {
  ctx: Ctx;
  projects: Project[];
  toggle: (p: string, t: string) => void;
  addTask: (p: string, task: Omit<Task, "id" | "done">) => void;
  completeAll: (p: string) => void;
  setArchived: (p: string, archived: boolean) => void;
  toast: (message: string) => void;
}) {
  const { v, t, s } = ctx;
  const { id } = useParams();
  const project = projects.find((p) => p.id === id);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(ME);
  const [due, setDue] = useState(daysFromToday(7));
  const [error, setError] = useState("");
  useDocumentTitle(`${project?.name ?? t.projects} – Plano`);
  if (!project) return <Navigate to="/projects" replace />;
  const { done, total, pct } = progressOf(project);
  const d = t.details;
  const assignees = project.members.includes(ME)
    ? project.members
    : [ME, ...project.members];
  const facts: [string, ReactNode][] = [
    [
      d.owner,
      <span key="owner" className="flex items-center gap-2">
        <Avatar name={project.owner} size={20} />
        {project.owner}
      </span>,
    ],
    [d.start, localDate(project.start, d.locale)],
    [d.due, localDate(project.due, d.locale)],
    [d.priority, d.priorities[project.priority]],
    [d.progress, d.progressValue(done, total)],
  ];
  const secondary = cx(
    "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium",
    s.secondary,
    s.ring,
  );

  return (
    <div className={s.stack}>
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 text-sm">
          <ol className={cx("flex min-w-0 items-center gap-1.5", s.muted)}>
            <li>
              <Link to="/projects" className={cx("hover:underline", s.ring)}>
                {t.projects}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="truncate" title={project.name}>
              {project.name}
            </li>
          </ol>
        </nav>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className={cx(s.heading, "truncate")} title={project.name}>
                {project.name}
              </h1>
              <StatusPill status={statusOf(project)} s={s} />
            </div>
            <p className={cx("mt-1 max-w-2xl text-sm", s.muted)}>
              {project.description ||
                `No description for this ${t.project} yet.`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label={t.share}
              title={v ? t.share : undefined}
              className={cx(
                "inline-flex items-center gap-2 text-sm font-medium",
                v ? "size-10 justify-center" : "px-3 py-1.5",
                s.secondary,
                s.ring,
              )}
              onClick={() => toast(t.linkCopied)}
              data-testid="share"
            >
              <Share2 className="size-4" aria-hidden />
              {!v && t.share}
            </button>
            {project.archived ? (
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setArchived(project.id, false);
                  toast(t.restored);
                }}
                data-testid="restore"
              >
                <ArchiveRestore className="size-4" aria-hidden />
                {t.restore}
              </button>
            ) : (
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setArchived(project.id, true);
                  toast(t.archived);
                }}
                data-testid="archive"
              >
                <Archive className="size-4" aria-hidden />
                {t.archive}
              </button>
            )}
          </div>
        </header>
      </div>

      {project.archived && (
        <p className={cx("px-4 py-3 text-sm", s.banner)}>{t.archivedBanner}</p>
      )}

      <div
        className={cx(
          "grid grid-cols-1 items-start",
          v
            ? "lg:grid-cols-[minmax(0,1fr)_340px]"
            : "lg:grid-cols-[minmax(0,1fr)_300px]",
          s.gap,
        )}
      >
        <div className={cx("flex min-w-0 flex-col", s.gap)}>
          <section className={cx(s.panel, s.pad)} data-testid="project-tasks">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className={s.subheading}>Tasks</h2>
              <span className={cx("text-xs tabular-nums", s.muted)}>
                {done} of {total} done
              </span>
            </div>
            <div className="mt-2">
              <Progress pct={pct} s={s} label={`${project.name} progress`} />
            </div>
            {total === 0 ? (
              <p className={cx("py-8 text-center text-sm", s.muted)}>
                No tasks yet. Add the first one below.
              </p>
            ) : (
              <ul className={cx("mt-2 divide-y", s.divide)}>
                {project.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    ctx={ctx}
                    disabled={project.archived}
                    onToggle={() => toggle(project.id, task.id)}
                  />
                ))}
              </ul>
            )}
            <form
              noValidate
              className={cx("mt-3 border-t pt-3", s.border)}
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return setError("Enter a task title");
                addTask(project.id, { title: title.trim(), assignee, due });
                setTitle("");
                setError("");
              }}
            >
              <fieldset
                disabled={project.archived}
                className="flex flex-wrap gap-2 disabled:opacity-60"
              >
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={t.taskPlaceholder}
                  aria-label={t.taskPlaceholder}
                  aria-invalid={Boolean(error)}
                  aria-describedby="task-error"
                  className={cx("min-w-48 flex-1", s.input, error && s.invalid)}
                  data-testid="task-title"
                />
                <select
                  aria-label="Assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className={cx(s.input, "max-w-44")}
                  data-testid="task-assignee"
                >
                  {assignees.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  aria-label="Task due date"
                  value={due}
                  onChange={(e) => setDue(e.target.value || daysFromToday(7))}
                  className={s.input}
                  data-testid="task-due"
                />
                <button
                  type="submit"
                  className={cx(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium",
                    s.primary,
                    s.ring,
                  )}
                  data-testid="add-task"
                >
                  <Plus className="size-4" aria-hidden />
                  {t.addTask}
                </button>
              </fieldset>
              <p
                id="task-error"
                className={cx("mt-1 min-h-5 text-sm", s.danger)}
              >
                {error}
              </p>
            </form>
          </section>

          <section
            className={cx(s.panel, s.pad)}
            data-testid="project-activity"
          >
            <h2 className={cx(s.subheading, "mb-3")}>Activity</h2>
            <ol>
              {project.activity.slice(0, 8).map((a, index, list) => (
                <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < list.length - 1 && (
                    <span
                      className={cx(
                        "absolute top-7 bottom-0 left-3 w-px",
                        s.track,
                      )}
                      aria-hidden
                    />
                  )}
                  <Avatar name={a.who} size={24} />
                  <div className="min-w-0 pt-0.5 text-sm">
                    <p>
                      <span className="font-medium">{a.who}</span>{" "}
                      <span className={s.subtle}>{activityText(a, t)}</span>
                    </p>
                    <time dateTime={a.at} className={cx("text-xs", s.muted)}>
                      {relativeTime(a.at)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className={cx("flex flex-col", s.gap)}>
          <section
            className={cx(s.panel, s.pad)}
            data-testid="project-details"
            lang={v ? "de" : "en"}
          >
            <h2 className={cx(s.subheading, "mb-3")}>{d.title}</h2>
            <dl className={cx("divide-y text-sm", s.divide)}>
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-0.5 py-2 first:pt-0"
                >
                  <dt className={cx("text-xs", s.muted)}>{label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              disabled={total === 0 || done === total || project.archived}
              className={cx(
                "mt-3 w-full px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
                s.secondary,
                s.ring,
              )}
              onClick={() => {
                completeAll(project.id);
                toast("All tasks marked done");
              }}
              data-testid="complete-all"
            >
              {d.markDone}
            </button>
          </section>

          <section className={cx(s.panel, s.pad)} data-testid="project-members">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className={s.subheading}>Members</h2>
              <span className={cx("text-xs tabular-nums", s.muted)}>
                {project.members.length}
              </span>
            </div>
            <ul className="space-y-2.5">
              {project.members.map((member) => (
                <li key={member} className="flex items-center gap-2.5 text-sm">
                  <Avatar name={member} size={28} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {member}
                      {member === ME && (
                        <span className={cx("font-normal", s.muted)}>
                          {" "}
                          (you)
                        </span>
                      )}
                    </p>
                    <p className={cx("truncate text-xs", s.muted)}>
                      {member === project.owner ? "Owner" : people[member]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => toast("Invite link copied")}
              className={cx(
                "mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline",
                s.accentText,
                s.ring,
              )}
            >
              <Link2 className="size-4" aria-hidden />
              Copy invite link
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

const notificationPrefs = [
  [
    "assigned",
    "A task is assigned to me",
    "Includes tasks reassigned from a teammate.",
  ],
  ["due", "A task is due soon", "One reminder the day before the due date."],
  [
    "mentions",
    "Someone mentions me",
    "Comments and replies that include your name.",
  ],
  [
    "weekly",
    "Weekly summary",
    "Progress across your teams every Monday morning.",
  ],
] as const;

type PrefKey = (typeof notificationPrefs)[number][0];

function SettingsPage({
  ctx,
  toast,
}: {
  ctx: Ctx;
  toast: (m: string) => void;
}) {
  const { s } = ctx;
  useDocumentTitle("Settings – Plano");
  const [name, setName] = useState(ME);
  const [email, setEmail] = useState("alex.morgan@lumenlabs.io");
  const [role, setRole] = useState(people[ME]);
  const [zone, setZone] = useState("America/New_York");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState<"" | "profile" | "notifications">("");
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    assigned: true,
    due: true,
    mentions: true,
    weekly: false,
  });
  const [digest, setDigest] = useState("daily");

  const save = (which: "profile" | "notifications", message: string) => {
    setSaving(which);
    setTimeout(() => {
      setSaving("");
      toast(message);
    }, 450);
  };

  const section = (
    id: string,
    heading: string,
    body: string,
    content: ReactNode,
  ) => (
    <section
      id={id}
      className={cx(
        "grid gap-4 border-t pt-6 md:grid-cols-[220px_minmax(0,1fr)]",
        s.border,
      )}
    >
      <div>
        <h2 className={s.subheading}>{heading}</h2>
        <p className={cx("mt-1 text-sm", s.muted)}>{body}</p>
      </div>
      <div className={cx(s.panel, s.pad, "max-w-xl")}>{content}</div>
    </section>
  );

  const field = "flex flex-col gap-1.5 text-sm";
  const submit = cx(
    "inline-flex items-center gap-2 self-start px-3.5 py-2 text-sm font-medium",
    s.primary,
    s.ring,
  );

  return (
    <div className={s.stack}>
      <header>
        <h1 className={s.heading}>Settings</h1>
        <p className={cx("mt-1 text-sm", s.muted)}>
          Manage your profile and how Plano keeps you posted.
        </p>
      </header>
      {section(
        "profile",
        "Profile",
        "How your name and role appear to teammates.",
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const next = {
              name: name.trim() ? undefined : "Enter your name",
              email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                ? undefined
                : "Enter a valid email address",
            };
            setErrors(next);
            if (next.name || next.email) return;
            save("profile", "Changes saved");
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar name={name.trim() || ME} size={44} />
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{name.trim() || ME}</p>
              <p className={cx("truncate", s.muted)}>{role}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={field}>
              <label htmlFor="display-name" className="font-medium">
                Display name
              </label>
              <input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby="display-name-error"
                className={cx(s.input, errors.name && s.invalid)}
                data-testid="display-name"
              />
              <p id="display-name-error" className={s.danger}>
                {errors.name}
              </p>
            </div>
            <div className={field}>
              <label htmlFor="email" className="font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-error"
                className={cx(s.input, errors.email && s.invalid)}
                data-testid="email"
              />
              <p id="email-error" className={s.danger}>
                {errors.email}
              </p>
            </div>
            <div className={field}>
              <label htmlFor="role" className="font-medium">
                Role
              </label>
              <input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={s.input}
              />
            </div>
            <div className={field}>
              <label htmlFor="time-zone" className="font-medium">
                Time zone
              </label>
              <select
                id="time-zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className={s.input}
              >
                <option value="America/Los_Angeles">
                  Pacific time (Los Angeles)
                </option>
                <option value="America/New_York">
                  Eastern time (New York)
                </option>
                <option value="Europe/London">
                  Greenwich mean time (London)
                </option>
                <option value="Europe/Berlin">
                  Central European time (Berlin)
                </option>
                <option value="Asia/Tokyo">Japan standard time (Tokyo)</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving === "profile"}
            className={submit}
            data-testid="save-settings"
          >
            {saving === "profile" && <Spinner />}
            Save changes
          </button>
        </form>,
      )}
      {section(
        "notifications",
        "Notifications",
        "Choose what Plano emails you about. In-app notifications are always on.",
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save("notifications", "Preferences saved");
          }}
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">Email me when</legend>
            {notificationPrefs.map(([key, label, hint]) => (
              <label key={key} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) =>
                    setPrefs({ ...prefs, [key]: e.target.checked })
                  }
                  className={cx("mt-0.5 size-4", s.check)}
                  data-testid={`pref-${key}`}
                />
                <span>
                  <span className="block">{label}</span>
                  <span className={cx("text-xs", s.muted)}>{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className={cx(field, "max-w-56")}>
            <label htmlFor="digest" className="font-medium">
              Email delivery
            </label>
            <select
              id="digest"
              value={digest}
              onChange={(e) => setDigest(e.target.value)}
              className={s.input}
            >
              <option value="instant">Send right away</option>
              <option value="daily">Daily digest</option>
              <option value="never">Never</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving === "notifications"}
            className={submit}
            data-testid="save-notifications"
          >
            {saving === "notifications" && <Spinner />}
            Save preferences
          </button>
        </form>,
      )}
    </div>
  );
}

function Sidebar({
  ctx,
  projects,
  toast,
}: {
  ctx: Ctx;
  projects: Project[];
  toast: (m: string) => void;
}) {
  const { v, t, s } = ctx;
  const [team, setTeam] = useState("Product team");
  const active = projects.filter((p) => !p.archived);
  const starred = ["website", "mobile", "onboarding"]
    .map((id) => active.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));
  const link = ({ isActive }: { isActive: boolean }) =>
    cx(
      "flex items-center gap-2.5 text-sm font-medium",
      s.navItem,
      isActive ? s.navActive : s.navIdle,
      s.ring,
    );

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-2.5 px-1" data-testid="logo">
        <Logo v={v} />
        <span
          className={cx("text-lg font-semibold tracking-tight", v && serif)}
        >
          Plano
        </span>
      </div>
      <Menu
        label="Switch team"
        triggerClassName={cx(
          "flex w-full items-center gap-2 border px-2.5 py-2 text-left text-sm",
          s.border,
          v ? "rounded-xl hover:bg-zinc-800" : "rounded-md hover:bg-zinc-50",
          s.ring,
        )}
        trigger={
          <>
            <Avatar name="Lumen Labs" size={24} className="rounded-md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">Lumen Labs</span>
              <span className={cx("block truncate text-xs", s.muted)}>
                {team}
              </span>
            </span>
            <ChevronsUpDown className={cx("size-4", s.muted)} aria-hidden />
          </>
        }
        items={["Product team", "Growth team", "Platform team"].map((name) => ({
          label: name,
          onSelect: () => {
            setTeam(name);
            toast(`Switched to ${name}`);
          },
        }))}
      />
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        <NavLink to="/" end className={link}>
          <HomeIcon className="size-4" aria-hidden /> Home
        </NavLink>
        <NavLink to="/projects" className={link}>
          <s.ProjectIcon className="size-4" aria-hidden />
          <span className="flex-1">{t.projects}</span>
          <span
            className={cx("rounded-full px-1.5 text-xs tabular-nums", s.count)}
          >
            {active.length}
          </span>
        </NavLink>
      </nav>
      <div>
        <h2 className={cx("mb-1 px-3 text-xs font-medium", s.muted)}>
          Starred
        </h2>
        <ul className="flex flex-col gap-0.5">
          {starred.map((p) => (
            <li key={p.id}>
              <NavLink to={`/projects/${p.id}`} className={link} title={p.name}>
                <span
                  className={cx("size-2 shrink-0 rounded-sm", s.accentBg)}
                  aria-hidden
                />
                <span className="truncate">{p.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <nav
        aria-label="Secondary"
        className={cx("mt-auto border-t pt-3", s.border)}
      >
        <NavLink to="/settings" className={link}>
          <s.SettingsIcon className="size-4" aria-hidden /> Settings
        </NavLink>
      </nav>
    </div>
  );
}

function Shell({
  ctx,
  projects,
  query,
  setQuery,
  toast,
  children,
}: {
  ctx: Ctx;
  projects: Project[];
  query: string;
  setQuery: (q: string) => void;
  toast: (m: string) => void;
  children: ReactNode;
}) {
  const { v, t, s } = ctx;
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = [
    {
      id: "n1",
      title: "Maya Chen assigned you Review pricing page design",
      time: hoursAgo(0.6),
      unread: true,
    },
    {
      id: "n2",
      title: "Jordan Lee commented on Fix login crash on Android",
      time: hoursAgo(3),
      unread: true,
    },
    {
      id: "n3",
      title: "Customer onboarding is due in 3 days",
      time: hoursAgo(7),
      unread: true,
    },
    {
      id: "n4",
      title: `Priya Patel added you to the Annual customer survey ${t.project}`,
      time: hoursAgo(28),
      unread: false,
    },
    {
      id: "n5",
      title: `Weekly summary: 14 tasks completed across 6 ${t.projects.toLowerCase()}`,
      time: hoursAgo(76),
      unread: false,
    },
  ];

  return (
    <div className={cx("flex min-h-screen", sans, s.root)}>
      <aside
        className={cx(
          "sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r md:block",
          v ? "p-5" : "p-4",
          s.sidebar,
        )}
      >
        <Sidebar ctx={ctx} projects={projects} toast={toast} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cx(
            "sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-3 sm:px-6",
            s.topbar,
          )}
        >
          <MobileNav label="Navigation" className={s.mobileNav}>
            <Sidebar ctx={ctx} projects={projects} toast={toast} />
          </MobileNav>
          <label className="relative min-w-0 flex-1 md:max-w-md">
            <span className="sr-only">{t.search}</span>
            <Search
              className={cx(
                "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2",
                s.muted,
              )}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (location.pathname !== "/projects") navigate("/projects");
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              placeholder={t.search}
              className={cx("w-full pl-9", s.input, v ? "py-2" : "py-1.5")}
              data-testid="project-search"
            />
          </label>
          <div className="ml-auto flex items-center gap-1">
            <Menu
              label="Help"
              triggerClassName={cx(
                "hidden size-9 place-items-center sm:grid",
                s.iconBtn,
                s.ring,
              )}
              trigger={<HelpCircle className="size-5" aria-hidden />}
              items={[
                "Help center",
                "Keyboard shortcuts",
                "Contact support",
              ].map((item) => ({
                label: item,
                onSelect: () => toast(`${item} isn't available in this demo`),
              }))}
            />
            <NotificationsMenu
              items={notifications}
              triggerClassName={cx(s.iconBtn, s.ring)}
            />
            <span className="ml-1 inline-flex">
              <UserMenu
                name={ME}
                email="alex.morgan@lumenlabs.io"
                items={["Profile", "Notification settings"]}
                onSelect={(item) =>
                  item === "Sign out"
                    ? toast("Sign out isn't available in this demo")
                    : navigate("/settings")
                }
              />
            </span>
          </div>
        </header>
        <main className={cx("mx-auto w-full max-w-6xl flex-1", s.main)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const ctx: Ctx = { v, t: copyFor(v), s: styleFor(v) };
  const { t, s } = ctx;
  const [projects, setProjects] = useState(seed);
  const [query, setQuery] = useState("");
  const [toasts, toast] = useToasts(s.toast);

  const log = (kind: ActivityKind, subject?: string): Activity => ({
    id: `a-${Date.now()}-${Math.random()}`,
    who: ME,
    kind,
    subject,
    at: new Date().toISOString(),
  });
  const update = (id: string, change: (p: Project) => Project) =>
    setProjects((current) => current.map((p) => (p.id === id ? change(p) : p)));
  const toggle = (projectId: string, taskId: string) =>
    update(projectId, (p) => {
      const task = p.tasks.find((item) => item.id === taskId);
      if (!task) return p;
      return {
        ...p,
        tasks: p.tasks.map((item) =>
          item.id === taskId ? { ...item, done: !item.done } : item,
        ),
        activity: [
          log(task.done ? "reopened" : "completed", task.title),
          ...p.activity,
        ],
      };
    });
  const addTask = (projectId: string, input: Omit<Task, "id" | "done">) =>
    update(projectId, (p) => ({
      ...p,
      tasks: [
        ...p.tasks,
        { ...input, id: `${projectId}-${Date.now()}`, done: false },
      ],
      members: p.members.includes(input.assignee)
        ? p.members
        : [...p.members, input.assignee],
      activity: [log("addedTask", input.title), ...p.activity],
    }));
  const completeAll = (projectId: string) =>
    update(projectId, (p) => ({
      ...p,
      tasks: p.tasks.map((task) => ({ ...task, done: true })),
      activity: [
        ...p.tasks
          .filter((task) => !task.done)
          .map((task) => log("completed", task.title)),
        ...p.activity,
      ],
    }));
  const setArchived = (projectId: string, archived: boolean) =>
    update(projectId, (p) => ({
      ...p,
      archived,
      activity: [log(archived ? "archived" : "restored"), ...p.activity],
    }));
  const create = (input: NewProject) => {
    setProjects((current) => [
      {
        id: `p-${Date.now()}`,
        ...input,
        start: daysFromToday(0),
        priority: "medium",
        archived: false,
        members: input.owner === ME ? [ME] : [input.owner, ME],
        tasks: [],
        activity: [log("created")],
      },
      ...current,
    ]);
    toast(t.created);
  };

  return (
    <HashRouter>
      <Shell
        ctx={ctx}
        projects={projects}
        query={query}
        setQuery={setQuery}
        toast={toast}
      >
        <Routes>
          <Route
            index
            element={<Home ctx={ctx} projects={projects} toggle={toggle} />}
          />
          <Route
            path="projects"
            element={
              <Projects
                ctx={ctx}
                projects={projects}
                query={query}
                setQuery={setQuery}
                create={create}
              />
            }
          />
          <Route
            path="projects/:id"
            element={
              <ProjectDetail
                ctx={ctx}
                projects={projects}
                toggle={toggle}
                addTask={addTask}
                completeAll={completeAll}
                setArchived={setArchived}
                toast={toast}
              />
            }
          />
          <Route
            path="settings"
            element={<SettingsPage ctx={ctx} toast={toast} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
      {toasts}
    </HashRouter>
  );
}
