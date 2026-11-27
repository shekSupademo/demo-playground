import {
  ChevronDown,
  CircleHelp,
  Inbox,
  Layers,
  ListTodo,
  type LucideIcon,
  Mountain,
  RefreshCcw,
  Search,
  Settings,
  SquarePen,
  TriangleAlert,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  MobileNav,
  NotificationsMenu,
  relativeTime,
  UserMenu,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import { CycleDetail, CyclesList } from "./cycles";
import { labels, me, notifications, people, teams } from "./data";
import { IssuePage } from "./issue";
import { MyIssues, SavedViewPage, TeamIssues, ViewsPage } from "./issues";
import { priorities } from "./model";
import { Header, Logo, StatusIcon, t } from "./parts";
import { ProjectDetail, ProjectsList } from "./projects";
import {
  CycleSettings,
  LabelsSettings,
  MembersSettings,
  SettingsHome,
  TeamSettings,
  TeamsSettings,
  TriageSettings,
  WorkflowSettings,
  WorkspaceSettings,
} from "./settings";
import { StoreProvider, useStore } from "./store";
import { Triage } from "./triage";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex h-7 items-center gap-2 rounded-md px-2 text-[13px]",
    t.focus,
    isActive
      ? "bg-slate-200/70 font-medium text-slate-900"
      : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900",
  );

function NavItem({
  to,
  Icon,
  label,
  count,
  testId,
  end,
}: {
  to: string;
  Icon: LucideIcon;
  label: string;
  count?: number;
  testId: string;
  end?: boolean;
}) {
  return (
    <NavLink to={to} end={end} className={navClass} data-testid={testId}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? (
        <span className="text-xs text-slate-500 tabular-nums">{count}</span>
      ) : null}
    </NavLink>
  );
}

function Sidebar() {
  const { issues, statusOf, views, v, setCommandOpen, setNewIssueOpen } =
    useStore();
  const [collapsed, setCollapsed] = useState<string[]>(["des"]);
  return (
    <div className="flex h-full flex-col gap-4" data-testid="sidebar">
      <div className="flex items-center gap-2 px-1">
        <Logo />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
          Halden Robotics
        </span>
        <button
          type="button"
          className={cx(t.ghost, "size-7")}
          aria-label="Search"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={cx(t.ghost, "size-7 border border-slate-200 bg-white")}
          aria-label="New issue"
          onClick={() => setNewIssueOpen({ teamId: "eng" })}
          data-testid="new-issue"
        >
          <SquarePen className="size-4" aria-hidden />
        </button>
      </div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        <NavItem
          to="/inbox"
          Icon={Inbox}
          label="Inbox"
          count={notifications.filter((n) => n.unread).length}
          testId="nav-inbox"
        />
        <NavItem
          to="/"
          end
          Icon={ListTodo}
          label="My issues"
          testId="nav-my-issues"
        />
      </nav>
      <div>
        <p className="px-2 pb-1 text-xs font-medium text-slate-500">
          Workspace
        </p>
        <NavItem
          to="/projects"
          Icon={Mountain}
          label="Projects"
          testId="nav-projects"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="px-2 text-xs font-medium text-slate-500">Your teams</p>
        {teams.map((team) => {
          const open = !collapsed.includes(team.id);
          const triage = issues.filter(
            (i) => i.teamId === team.id && statusOf(i)?.category === "triage",
          ).length;
          const own = views.filter((x) => x.teamId === team.id);
          return (
            <div key={team.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setCollapsed((all) =>
                    open ? [...all, team.id] : all.filter((x) => x !== team.id),
                  )
                }
                className={cx(
                  "flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] font-medium text-slate-700 hover:bg-slate-200/40",
                  t.focus,
                )}
              >
                <span
                  className="grid size-4 place-items-center rounded text-[9px] font-bold text-white"
                  style={{ background: team.color }}
                >
                  {team.key[0]}
                </span>
                {team.name}
                <ChevronDown
                  className={cx(
                    "ml-auto size-3.5 text-slate-400",
                    !open && "-rotate-90",
                  )}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="ml-3 flex flex-col gap-0.5 border-l border-slate-200 pl-2">
                  <NavItem
                    to={`/team/${team.id}/issues`}
                    Icon={Layers}
                    label="Issues"
                    testId={`nav-team-${team.id}-issues`}
                  />
                  <NavItem
                    to={`/team/${team.id}/cycles`}
                    Icon={RefreshCcw}
                    label="Cycles"
                    testId={`nav-team-${team.id}-cycles`}
                  />
                  <NavItem
                    to={`/team/${team.id}/triage`}
                    Icon={TriangleAlert}
                    label="Triage"
                    count={triage}
                    testId={`nav-team-${team.id}-triage`}
                  />
                  {v ? (
                    <NavItem
                      to={`/team/${team.id}/views`}
                      end
                      Icon={Layers}
                      label="Views"
                      testId={`nav-team-${team.id}-views`}
                    />
                  ) : (
                    own.map((x) => (
                      <NavItem
                        key={x.id}
                        to={`/team/${team.id}/views/${x.id}`}
                        Icon={Layers}
                        label={x.name}
                        testId={`nav-view-${x.id}`}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto flex flex-col gap-0.5">
        <NavItem
          to="/settings"
          Icon={Settings}
          label="Settings"
          testId="nav-settings"
        />
      </div>
    </div>
  );
}

function CommandMenu() {
  const {
    commandOpen,
    setCommandOpen,
    issues,
    projects,
    setNewIssueOpen,
    statusOf,
  } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);
  const term = q.trim().toLowerCase();
  const close = () => {
    setQ("");
    setCommandOpen(false);
  };
  const go = (to: string) => {
    navigate(to);
    close();
  };
  const actions = [
    {
      label: "Create new issue",
      run: () => {
        close();
        setNewIssueOpen({ teamId: "eng" });
      },
    },
    { label: "Go to My issues", run: () => go("/") },
    { label: "Go to Projects", run: () => go("/projects") },
    { label: "Go to Engineering issues", run: () => go("/team/eng/issues") },
    { label: "Go to Engineering cycles", run: () => go("/team/eng/cycles") },
    { label: "Go to Settings", run: () => go("/settings") },
  ].filter((a) => a.label.toLowerCase().includes(term));
  const found = term
    ? issues
        .filter((i) => `${i.key} ${i.title}`.toLowerCase().includes(term))
        .slice(0, 8)
    : [];
  const foundProjects = term
    ? projects.filter((p) => p.name.toLowerCase().includes(term))
    : [];
  return (
    <Dialog
      open={commandOpen}
      onClose={close}
      title={<span className="sr-only">Command menu</span>}
      className="mt-[12vh] mb-auto w-full max-w-xl overflow-hidden rounded-xl bg-white p-0 text-slate-900 shadow-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (found[0]) go(`/issue/${found[0].key}`);
          else actions[0]?.run();
        }}
      >
        <label className="flex items-center gap-2 border-b border-slate-200 px-4">
          <Search className="size-4 text-slate-400" aria-hidden />
          <span className="sr-only">Search issues, projects and commands</span>
          <input
            autoFocus
            className="h-12 flex-1 bg-transparent text-sm outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issues, projects and commands"
            data-testid="command-input"
          />
          <kbd className="rounded border border-slate-200 px-1.5 text-[11px] text-slate-500">
            Esc
          </kbd>
        </label>
      </form>
      <div
        className="max-h-96 overflow-y-auto p-2 text-[13px]"
        data-testid="command-results"
      >
        {found.length > 0 && (
          <p className="px-2 pt-1 pb-1 text-xs text-slate-500">Issues</p>
        )}
        {found.map((i) => (
          <button
            key={i.id}
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-slate-100"
            onClick={() => go(`/issue/${i.key}`)}
          >
            <StatusIcon category={statusOf(i)?.category ?? "backlog"} />
            <span className="w-16 shrink-0 text-slate-500">{i.key}</span>
            <span className="truncate">{i.title}</span>
          </button>
        ))}
        {foundProjects.length > 0 && (
          <p className="px-2 pt-2 pb-1 text-xs text-slate-500">Projects</p>
        )}
        {foundProjects.map((p) => (
          <button
            key={p.id}
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-slate-100"
            onClick={() => go(`/projects/${p.id}`)}
          >
            <Mountain className="size-4 text-slate-400" aria-hidden />
            {p.name}
          </button>
        ))}
        {actions.length > 0 && (
          <p className="px-2 pt-2 pb-1 text-xs text-slate-500">Commands</p>
        )}
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="flex w-full items-center rounded-md px-2 py-2 text-left hover:bg-slate-100"
            onClick={a.run}
          >
            {a.label}
          </button>
        ))}
        {found.length + foundProjects.length + actions.length === 0 && (
          <p className="px-2 py-6 text-center text-slate-500">
            Nothing matches “{q.trim()}”
          </p>
        )}
      </div>
    </Dialog>
  );
}

function NewIssueDialog() {
  const {
    newIssueOpen,
    setNewIssueOpen,
    createIssue,
    statuses,
    toast,
    projects,
  } = useStore();
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("eng");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("todo");
  const [priority, setPriority] = useState(0);
  const [assigneeId, setAssigneeId] = useState("");
  const [labelId, setLabelId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (newIssueOpen) setTeamId(newIssueOpen.teamId);
  }, [newIssueOpen]);
  const close = () => {
    setTitle("");
    setDescription("");
    setTouched(false);
    setNewIssueOpen(null);
  };
  const team = teams.find((x) => x.id === teamId) ?? teams[0];
  const select = cx(t.input, "h-8 w-auto py-0 text-[13px]");
  return (
    <Dialog
      open={newIssueOpen !== null}
      onClose={close}
      title={
        <span className="text-sm font-medium text-slate-500">
          {team.key} › New issue
        </span>
      }
      className={cx(t.dialog, "max-w-2xl")}
    >
      <form
        className="mt-3 flex flex-col gap-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!title.trim()) return;
          const issue = createIssue({
            teamId,
            title: title.trim(),
            description: description.trim(),
            statusId,
            priority,
            assigneeId: assigneeId || null,
            labelIds: labelId ? [labelId] : [],
            projectId: projectId || null,
          });
          toast(`${issue.key} created`);
          close();
          navigate(`/team/${teamId}/issues`);
        }}
      >
        <label>
          <span className="sr-only">Title</span>
          <input
            autoFocus
            className="w-full text-lg font-medium outline-none placeholder:text-slate-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            aria-invalid={touched && !title.trim()}
            data-testid="new-issue-title"
          />
        </label>
        {touched && !title.trim() && (
          <p className="text-sm text-rose-600">Enter a title</p>
        )}
        <label>
          <span className="sr-only">Description</span>
          <textarea
            className="min-h-24 w-full resize-none text-sm outline-none placeholder:text-slate-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Team"
            className={select}
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            {teams.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            className={select}
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
          >
            {statuses[teamId]
              .filter((s) => s.category !== "triage")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <select
            aria-label="Priority"
            className={select}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Assignee"
            className={select}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">No assignee</option>
            {people
              .filter((p) => team.members.includes(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <select
            aria-label="Label"
            className={select}
            value={labelId}
            onChange={(e) => setLabelId(e.target.value)}
          >
            <option value="">No label</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Project"
            className={select}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" className={t.secondary} onClick={close}>
            Cancel
          </button>
          <button
            type="submit"
            className={t.primary}
            data-testid="create-issue"
          >
            Create issue
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function InboxPage() {
  return (
    <div>
      <Header crumbs={[{ label: "Inbox" }]} />
      <h1 className="sr-only">Inbox</h1>
      <ul className="divide-y divide-slate-100">
        {notifications.map((n) => {
          const key = n.title.match(/[A-Z]{3}-\d+/)?.[0];
          const body = (
            <>
              <span
                className={cx(
                  "size-2 shrink-0 rounded-full",
                  n.unread ? "bg-[#3046C5]" : "bg-transparent",
                )}
              />
              <span
                className={cx(
                  "min-w-0 flex-1 truncate",
                  n.unread && "font-medium",
                )}
              >
                {n.title}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {relativeTime(n.time)}
              </span>
            </>
          );
          return (
            <li key={n.id}>
              {key ? (
                <Link
                  to={`/issue/${key}`}
                  className={cx(
                    "flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-slate-50 md:px-6",
                    t.focus,
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 text-[13px] md:px-6">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WorkflowGate({ want }: { want: "baseline" | "variant" }) {
  const { v } = useStore();
  return v === (want === "variant") ? (
    <WorkflowSettings />
  ) : (
    <Navigate to="/settings/teams" replace />
  );
}

function Shell({
  toasts,
  toast,
}: {
  toasts: ReactNode;
  toast: (m: string) => void;
}) {
  const navigate = useNavigate();
  const user = people.find((p) => p.id === me);
  return (
    <div
      className={cx("flex h-dvh overflow-hidden", t.page)}
      style={{ fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif" }}
    >
      <aside
        className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 px-3 py-3 md:block"
        data-testid="logo"
      >
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200 px-3">
          <MobileNav label="Corvid navigation" className="bg-slate-50">
            <Sidebar />
          </MobileNav>
          <span className="flex items-center gap-2 md:hidden">
            <Logo size={20} />
            <span className="text-[13px] font-semibold">Corvid</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Menu
              label="Help"
              trigger={<CircleHelp className="size-4" aria-hidden />}
              triggerClassName={t.ghost}
              testId="help-menu"
              items={[
                {
                  label: "Keyboard shortcuts",
                  onSelect: () => toast("Press ⌘K to search and run commands"),
                },
                { label: "Docs", onSelect: () => toast("Docs opened") },
                {
                  label: "Contact support",
                  onSelect: () => toast("Support chat opened"),
                },
              ]}
            />
            <NotificationsMenu
              items={notifications}
              triggerClassName="size-8 text-slate-600"
            />
            <UserMenu
              name={user?.name ?? ""}
              email={user?.email ?? ""}
              items={["Your issues", "Settings"]}
              onSelect={(item) =>
                item === "Settings"
                  ? navigate("/settings")
                  : item === "Your issues"
                    ? navigate("/")
                    : toast("Signed out")
              }
            />
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<MyIssues />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="issue/:key" element={<IssuePage />} />
            <Route path="team/:teamId/issues" element={<TeamIssues />} />
            <Route path="team/:teamId/views" element={<ViewsPage />} />
            <Route
              path="team/:teamId/views/:viewId"
              element={<SavedViewPage />}
            />
            <Route path="team/:teamId/cycles" element={<CyclesList />} />
            <Route
              path="team/:teamId/cycles/:cycleId"
              element={<CycleDetail />}
            />
            <Route path="team/:teamId/triage" element={<Triage />} />
            <Route path="settings" element={<SettingsHome />} />
            <Route path="settings/workspace" element={<WorkspaceSettings />} />
            <Route path="settings/members" element={<MembersSettings />} />
            <Route path="settings/labels" element={<LabelsSettings />} />
            <Route path="settings/teams" element={<TeamsSettings />} />
            <Route path="settings/teams/:teamId" element={<TeamSettings />} />
            <Route
              path="settings/teams/:teamId/workflow"
              element={<WorkflowGate want="baseline" />}
            />
            <Route
              path="settings/teams/:teamId/statuses"
              element={<WorkflowGate want="variant" />}
            />
            <Route
              path="settings/teams/:teamId/cycles"
              element={<CycleSettings />}
            />
            <Route
              path="settings/teams/:teamId/triage"
              element={<TriageSettings />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <CommandMenu />
      <NewIssueDialog />
      {toasts}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const [toasts, toast] = useToasts("bg-[#141B3D] text-white");
  return (
    <HashRouter>
      <StoreProvider v={variant === "variant"} toast={toast}>
        <Shell toasts={toasts} toast={toast} />
      </StoreProvider>
    </HashRouter>
  );
}
