import {
  Box,
  Briefcase,
  Folder,
  HelpCircle,
  Home as HomeIcon,
  Leaf,
  Megaphone,
  Plus,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";

type Task = { id: string; title: string; done: boolean };
type Project = {
  id: string;
  name: string;
  owner: string;
  due: string;
  archived: boolean;
  tasks: Task[];
};

const seed: Project[] = [
  {
    id: "website",
    name: "Website relaunch",
    owner: "Maya Chen",
    due: "2026-12-04",
    archived: false,
    tasks: [
      { id: "w1", title: "Write homepage copy", done: true },
      { id: "w2", title: "Review pricing page design", done: false },
      { id: "w3", title: "Set up redirects", done: false },
    ],
  },
  {
    id: "mobile",
    name: "Mobile app beta",
    owner: "Jordan Lee",
    due: "2026-12-12",
    archived: false,
    tasks: [
      { id: "m1", title: "Recruit 20 beta testers", done: false },
      { id: "m2", title: "Fix login crash on Android", done: true },
    ],
  },
  {
    id: "onboarding",
    name: "Customer onboarding",
    owner: "Priya Patel",
    due: "2026-12-02",
    archived: false,
    tasks: [
      { id: "o1", title: "Draft welcome email sequence", done: false },
      { id: "o2", title: "Record setup walkthrough", done: false },
    ],
  },
  {
    id: "q1",
    name: "Q1 planning",
    owner: "Sam Rivera",
    due: "2027-01-15",
    archived: false,
    tasks: [{ id: "q1a", title: "Collect team goals", done: false }],
  },
];

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
    myTasks: "My tasks",
    completed: "Completed tasks",
    activity: "Recent activity",
    search: v ? "Find a workspace, task, or person" : "Search projects",
    newProject: v ? "New workspace" : "New project",
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
    share: "Share",
    linkCopied: "Link copied",
    details: v
      ? {
          title: "Projektdetails",
          owner: "Verantwortliche Person",
          due: "Fälligkeitsdatum",
          progress: "Fortschritt",
          markDone: "Alle Aufgaben als erledigt markieren",
        }
      : {
          title: "Project details",
          owner: "Owner",
          due: "Due date",
          progress: "Progress",
          markDone: "Mark all tasks done",
        },
  };
}

type Copy = ReturnType<typeof copyFor>;

function styleFor(v: boolean) {
  return {
    root: v ? "dark bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900",
    sidebar: v ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
    card: v
      ? "rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-fade-up"
      : "rounded-md border border-zinc-200 bg-white p-3",
    gap: v ? "gap-6" : "gap-3",
    heading: v
      ? "font-serif text-4xl font-medium tracking-tight"
      : "text-2xl font-semibold",
    subheading: v
      ? "font-serif text-xl"
      : "text-sm font-semibold uppercase tracking-wide text-zinc-500",
    primary: v
      ? "rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
      : "rounded-md bg-indigo-600 text-white hover:bg-indigo-500",
    secondary: v
      ? "rounded-xl border border-zinc-700 hover:bg-zinc-800"
      : "rounded-md border border-zinc-300 bg-white hover:bg-zinc-100",
    accentText: v ? "text-emerald-400" : "text-indigo-600",
    navActive: v
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-indigo-50 text-indigo-700",
    input: v
      ? "rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
      : "rounded-md border border-zinc-300 bg-white px-3 py-2",
    dialog: v
      ? "w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-zinc-100 animate-slide-in"
      : "w-full max-w-md rounded-md bg-white p-5 text-zinc-900",
    ProjectIcon: v ? Briefcase : Folder,
    SettingsIcon: v ? SlidersHorizontal : Settings,
  };
}

type Style = ReturnType<typeof styleFor>;
type Ctx = { v: boolean; t: Copy; s: Style };

function Logo({ v }: { v: boolean }) {
  return v ? (
    <span className="grid size-8 place-items-center rounded-full bg-emerald-600 text-white">
      <Leaf className="size-4" aria-hidden />
    </span>
  ) : (
    <span className="grid size-8 place-items-center rounded-md bg-indigo-600 font-bold text-white">
      P
    </span>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <li className="flex items-center gap-2 py-1">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.done}
        onChange={onToggle}
        data-testid={`task-${task.id}`}
      />
      <label
        htmlFor={`task-${task.id}`}
        className={cx(task.done && "text-zinc-500 line-through")}
      >
        {task.title}
      </label>
    </li>
  );
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
  const active = projects.filter((p) => !p.archived);
  const open = active.flatMap((p) =>
    p.tasks.filter((task) => !task.done).map((task) => ({ p, task })),
  );
  const done = active.flatMap((p) =>
    p.tasks.filter((task) => task.done).map((task) => ({ p, task })),
  );

  const dueSoon = (
    <section key="due" className={s.card} data-testid="section-due-soon">
      <div className="mb-2 flex items-center gap-2">
        <h2 className={s.subheading}>{t.dueSoon}</h2>
        <button
          type="button"
          title={t.dueTooltip}
          aria-label={t.dueTooltip}
          data-testid="due-help"
        >
          <HelpCircle className="size-4 text-zinc-400" aria-hidden />
        </button>
      </div>
      <ul className="divide-y divide-zinc-500/10">
        {[...active]
          .sort((a, b) => a.due.localeCompare(b.due))
          .slice(0, 3)
          .map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <Link
                to={`/projects/${p.id}`}
                className={cx(
                  "flex items-center gap-2 font-medium",
                  s.accentText,
                )}
              >
                <s.ProjectIcon className="size-4" aria-hidden /> {p.name}
              </Link>
              <span className="text-sm text-zinc-500">{p.due}</span>
            </li>
          ))}
      </ul>
    </section>
  );

  const myTasks = (
    <section key="tasks" className={s.card} data-testid="section-my-tasks">
      <h2 className={cx(s.subheading, "mb-2")}>{t.myTasks}</h2>
      <ul>
        {open.map(({ p, task }) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => toggle(p.id, task.id)}
          />
        ))}
      </ul>
      <details open={!v} className="mt-3" data-testid="completed-tasks">
        <summary className="cursor-pointer text-sm font-medium">
          {t.completed} ({done.length})
        </summary>
        <ul className="mt-1">
          {done.map(({ p, task }) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggle(p.id, task.id)}
            />
          ))}
        </ul>
      </details>
    </section>
  );

  return (
    <div className={cx("flex flex-col", s.gap)}>
      <header>
        <h1 className={s.heading}>{t.homeHeading}</h1>
        <p className="mt-1 text-zinc-500">{t.homeBody}</p>
      </header>
      {v && (
        <section
          className={cx(s.card, "flex items-start gap-3 border-emerald-700")}
          data-testid="announcement"
        >
          <Megaphone className="mt-0.5 size-5 text-emerald-400" aria-hidden />
          <div>
            <h2 className="font-semibold">Team offsite on December 10</h2>
            <p className="text-sm text-zinc-400">
              Add your agenda ideas to the shared doc by Friday.
            </p>
          </div>
        </section>
      )}
      <div className={cx("grid md:grid-cols-2", s.gap)}>
        {v ? [myTasks, dueSoon] : [dueSoon, myTasks]}
      </div>
      {!v && (
        <section className={s.card} data-testid="recent-activity">
          <h2 className={cx(s.subheading, "mb-2")}>{t.activity}</h2>
          <ul className="space-y-1 text-sm text-zinc-600">
            <li>Maya completed "Write homepage copy"</li>
            <li>Jordan completed "Fix login crash on Android"</li>
            <li>Priya created Customer onboarding</li>
          </ul>
        </section>
      )}
    </div>
  );
}

function Projects({
  ctx,
  projects,
  create,
}: {
  ctx: Ctx;
  projects: Project[];
  create: (name: string) => void;
}) {
  const { t, s } = ctx;
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const shown = projects.filter(
    (p) =>
      p.archived === (tab === "archived") &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError(t.nameError);
    create(name.trim());
    setName("");
    setError("");
    setOpen(false);
  }

  return (
    <div className={cx("flex flex-col", s.gap)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={s.heading}>{t.projects}</h1>
        <button
          type="button"
          className={cx(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium",
            s.primary,
          )}
          onClick={() => setOpen(true)}
          data-testid="new-project"
        >
          <Plus className="size-4" aria-hidden /> {t.newProject}
        </button>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <Search
            className="absolute top-2.5 left-3 size-4 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className={cx("w-full pl-9", s.input)}
            data-testid="project-search"
          />
        </label>
        <div role="tablist" className="flex gap-1">
          {(["active", "archived"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cx(
                "px-3 py-1.5 text-sm capitalize",
                tab === value ? s.navActive : "text-zinc-500",
                "rounded-md",
              )}
              data-testid={`tab-${value}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div
          className={cx(s.card, "py-12 text-center")}
          data-testid="empty-state"
        >
          {ctx.v ? (
            <Sparkles
              className="mx-auto size-10 text-emerald-400"
              aria-hidden
            />
          ) : (
            <Box className="mx-auto size-8 text-zinc-400" aria-hidden />
          )}
          <h2 className="mt-3 font-semibold">{t.emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
            {t.emptyBody}
          </p>
        </div>
      ) : (
        <ul className={cx("grid sm:grid-cols-2", s.gap)}>
          {shown.map((p) => (
            <li key={p.id} className={s.card} data-testid={`project-${p.id}`}>
              <Link
                to={`/projects/${p.id}`}
                className="flex items-center gap-2 font-medium"
              >
                <s.ProjectIcon
                  className={cx("size-4", s.accentText)}
                  aria-hidden
                />{" "}
                {p.name}
              </Link>
              <p className="mt-1 text-sm text-zinc-500">
                {p.owner} · due {p.due} ·{" "}
                {p.tasks.filter((task) => task.done).length}/{p.tasks.length}{" "}
                tasks
              </p>
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t.newProject}
        className={s.dialog}
        testId="new-project-dialog"
      >
        <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.nameLabel}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby="name-error"
              className={s.input}
              data-testid="project-name"
            />
          </label>
          <p
            id="name-error"
            className="text-sm text-rose-500"
            data-testid="project-name-error"
          >
            {error}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={cx("px-4 py-2 text-sm", s.secondary)}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cx("px-4 py-2 text-sm font-medium", s.primary)}
              data-testid="create-project"
            >
              {t.newProject}
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
  archive,
  toast,
}: {
  ctx: Ctx;
  projects: Project[];
  toggle: (p: string, t: string) => void;
  addTask: (p: string, title: string) => void;
  completeAll: (p: string) => void;
  archive: (p: string) => void;
  toast: (message: string) => void;
}) {
  const { v, t, s } = ctx;
  const { id } = useParams();
  const project = projects.find((p) => p.id === id);
  const [title, setTitle] = useState("");
  if (!project) return <Navigate to="/projects" replace />;
  const done = project.tasks.filter((task) => task.done).length;

  return (
    <div className={cx("flex flex-col", s.gap)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/projects"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← {t.projects}
          </Link>
          <h1 className={s.heading}>{project.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={t.share}
            title={v ? t.share : undefined}
            className={cx(
              "inline-flex items-center gap-2 text-sm",
              v ? "p-2" : "px-3 py-2",
              s.secondary,
            )}
            onClick={() => toast(t.linkCopied)}
            data-testid="share"
          >
            <Share2 className="size-4" aria-hidden />
            {!v && t.share}
          </button>
          <button
            type="button"
            className={cx("px-3 py-2 text-sm", s.secondary)}
            onClick={() => archive(project.id)}
            data-testid="archive"
          >
            {t.archive}
          </button>
        </div>
      </header>
      <div className={cx("grid md:grid-cols-[2fr_1fr]", s.gap)}>
        <section className={s.card}>
          <ul>
            {project.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggle(project.id, task.id)}
              />
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              addTask(project.id, title.trim());
              setTitle("");
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.taskPlaceholder}
              aria-label={t.taskPlaceholder}
              className={cx("flex-1", s.input)}
              data-testid="task-title"
            />
            <button
              type="submit"
              className={cx("px-4 py-2 text-sm font-medium", s.primary)}
              data-testid="add-task"
            >
              {t.addTask}
            </button>
          </form>
        </section>
        <section
          className={s.card}
          data-testid="project-details"
          lang={v ? "de" : "en"}
        >
          <h2 className={cx(s.subheading, "mb-3")}>{t.details.title}</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">{t.details.owner}</dt>
              <dd>{project.owner}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t.details.due}</dt>
              <dd>
                {new Date(project.due).toLocaleDateString(
                  v ? "de-DE" : "en-US",
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t.details.progress}</dt>
              <dd>
                {done}/{project.tasks.length}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className={cx("mt-4 w-full px-3 py-2 text-sm", s.secondary)}
            onClick={() => completeAll(project.id)}
            data-testid="complete-all"
          >
            {t.details.markDone}
          </button>
        </section>
      </div>
    </div>
  );
}

function SettingsPage({
  ctx,
  toast,
}: {
  ctx: Ctx;
  toast: (m: string) => void;
}) {
  const { s } = ctx;
  const [name, setName] = useState("Alex Morgan");
  return (
    <form
      className={cx("flex max-w-md flex-col", s.gap)}
      onSubmit={(e) => {
        e.preventDefault();
        toast("Settings saved");
      }}
    >
      <h1 className={s.heading}>Settings</h1>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Display name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={s.input}
          data-testid="display-name"
        />
      </label>
      <button
        type="submit"
        className={cx("self-start px-4 py-2 text-sm font-medium", s.primary)}
        data-testid="save-settings"
      >
        Save
      </button>
    </form>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const ctx: Ctx = { v, t: copyFor(v), s: styleFor(v) };
  const { t, s } = ctx;
  const [projects, setProjects] = useState(seed);
  const [toasts, toast] = useToasts(
    v ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white",
  );

  const update = (id: string, change: (p: Project) => Project) =>
    setProjects((current) => current.map((p) => (p.id === id ? change(p) : p)));
  const toggle = (projectId: string, taskId: string) =>
    update(projectId, (p) => ({
      ...p,
      tasks: p.tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    }));
  const addTask = (projectId: string, title: string) =>
    update(projectId, (p) => ({
      ...p,
      tasks: [
        ...p.tasks,
        { id: `${projectId}-${Date.now()}`, title, done: false },
      ],
    }));
  const completeAll = (projectId: string) =>
    update(projectId, (p) => ({
      ...p,
      tasks: p.tasks.map((task) => ({ ...task, done: true })),
    }));
  const archive = (projectId: string) =>
    update(projectId, (p) => ({ ...p, archived: true }));
  const create = (name: string) => {
    setProjects((current) => [
      ...current,
      {
        id: `p-${Date.now()}`,
        name,
        owner: "Alex Morgan",
        due: "2027-01-31",
        archived: false,
        tasks: [],
      },
    ]);
    toast(t.created);
  };

  const nav = [
    { to: "/", label: "Home", Icon: HomeIcon, end: true },
    { to: "/projects", label: t.projects, Icon: s.ProjectIcon, end: false },
    { to: "/settings", label: "Settings", Icon: s.SettingsIcon, end: false },
  ];

  return (
    <HashRouter>
      <div className={cx("flex min-h-screen", s.root)}>
        <aside className={cx("w-56 shrink-0 border-r p-4", s.sidebar)}>
          <div
            className="mb-6 flex items-center gap-2 font-semibold"
            data-testid="logo"
          >
            <Logo v={v} /> Plano
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {nav.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    isActive ? s.navActive : "text-zinc-500 hover:text-current",
                  )
                }
              >
                <Icon className="size-4" aria-hidden /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className={cx("flex-1", v ? "p-10" : "p-6")}>
          <Routes>
            <Route
              index
              element={<Home ctx={ctx} projects={projects} toggle={toggle} />}
            />
            <Route
              path="projects"
              element={
                <Projects ctx={ctx} projects={projects} create={create} />
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
                  archive={archive}
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
        </main>
      </div>
      {toasts}
    </HashRouter>
  );
}
