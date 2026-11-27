import { ChevronRight } from "lucide-react";
import { Link, Navigate, NavLink, useParams } from "react-router-dom";
import { Avatar, Badge, formatDate } from "../../kit";
import { cx } from "../../ui";
import { cycles, people, teams } from "./data";
import { progress } from "./model";
import { Bar, Header, StatusIcon, t } from "./parts";
import { useStore } from "./store";

const today = () => new Date().toISOString().slice(0, 10);

export function TeamTabs({ teamId }: { teamId: string }) {
  const { issues, statusOf, v } = useStore();
  const triage = issues.filter(
    (i) => i.teamId === teamId && statusOf(i)?.category === "triage",
  ).length;
  const tabs = [
    { id: "overview", label: "Overview", to: `/team/${teamId}`, end: true },
    { id: "issues", label: "Issues", to: `/team/${teamId}/issues` },
    { id: "cycles", label: "Cycles", to: `/team/${teamId}/cycles` },
    {
      id: "triage",
      label: triage ? `Triage ${triage}` : "Triage",
      to: `/team/${teamId}/triage`,
    },
    { id: "projects", label: "Projects", to: `/team/${teamId}/projects` },
    ...(v
      ? [{ id: "views", label: "Views", to: `/team/${teamId}/views` }]
      : []),
  ];
  return (
    <nav aria-label="Team" className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.to}
          end={tab.end}
          data-testid={`team-tab-${tab.id}`}
          className={({ isActive }) =>
            cx(
              "h-7 shrink-0 rounded-md px-2.5 text-[13px] leading-7 font-medium",
              t.focus,
              isActive
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function TeamsPage() {
  const { issues, statusOf } = useStore();
  return (
    <div>
      <Header crumbs={[{ label: "Teams" }]} />
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold">Teams</h1>
        <p className="mt-1 text-sm text-slate-500">
          Each team has its own issues, cycles, triage queue and workflow.
        </p>
        <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {teams.map((team) => {
            const open = issues.filter(
              (i) =>
                i.teamId === team.id &&
                ["unstarted", "started"].includes(statusOf(i)?.category ?? ""),
            ).length;
            return (
              <li key={team.id}>
                <Link
                  to={`/team/${team.id}`}
                  data-testid={`team-${team.id}`}
                  className={cx(
                    "flex items-center gap-3 px-4 py-4 hover:bg-slate-50",
                    t.focus,
                  )}
                >
                  <span
                    className="grid size-8 place-items-center rounded-md text-xs font-semibold text-white"
                    style={{ background: team.color }}
                  >
                    {team.key}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {team.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {team.members.length} members, {open} open issues
                    </span>
                  </span>
                  <span className="hidden -space-x-1.5 sm:flex">
                    {team.members.slice(0, 5).map((id) => (
                      <Avatar
                        key={id}
                        name={people.find((p) => p.id === id)?.name ?? ""}
                        size={22}
                        className="ring-2 ring-white"
                      />
                    ))}
                  </span>
                  <ChevronRight className="size-4 text-slate-300" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function TeamHome() {
  const { teamId = "" } = useParams();
  const { issues, statuses, statusOf, projects } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/teams" replace />;
  const own = issues.filter((i) => i.teamId === teamId);
  const count = (category: string) =>
    own.filter((i) => statusOf(i)?.category === category).length;
  const current = cycles.find(
    (c) => c.teamId === teamId && c.start <= today() && c.end >= today(),
  );
  const scope = current ? own.filter((i) => i.cycleId === current.id) : [];
  const p = progress(scope, statuses[teamId]);
  const teamProjects = projects.filter((x) => x.teamIds.includes(teamId));
  return (
    <div>
      <Header
        tabs={<TeamTabs teamId={teamId} />}
        crumbs={[{ label: "Teams", to: "/teams" }, { label: team.name }]}
      />
      <div className="grid gap-8 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {team.name}
            </h1>
            <p className="text-sm text-slate-500">
              Issue keys start with {team.key}.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["Triage", count("triage"), "triage"],
                ["Backlog", count("backlog"), "backlog"],
                ["Todo", count("unstarted"), "unstarted"],
                ["In progress", count("started"), "started"],
              ] as const
            ).map(([label, n, category]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 p-3"
              >
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <StatusIcon category={category} size={12} />
                  {label}
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
          {current && (
            <section>
              <h2 className="text-[13px] font-medium">Current cycle</h2>
              <div className="mt-2 rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">Cycle {current.number}</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(current.start)} to {formatDate(current.end)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Bar pct={p.pct} />
                  <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                    {p.done} of {p.total} done
                  </span>
                </div>
              </div>
            </section>
          )}
          <section>
            <h2 className="text-[13px] font-medium">Projects</h2>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {teamProjects.map((x) => (
                <li
                  key={x.id}
                  className="flex items-center gap-3 px-4 py-3 text-[13px]"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {x.name}
                  </span>
                  {x.updates[0] && (
                    <Badge
                      tone={
                        x.updates[0].health === "On track"
                          ? "success"
                          : "warning"
                      }
                    >
                      {x.updates[0].health}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside>
          <h2 className="text-[13px] font-medium">Members</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {team.members.map((id) => {
              const person = people.find((x) => x.id === id);
              const assigned = own.filter(
                (i) =>
                  i.assigneeId === id &&
                  ["unstarted", "started"].includes(
                    statusOf(i)?.category ?? "",
                  ),
              ).length;
              return (
                <li key={id} className="flex items-center gap-2 text-[13px]">
                  <Avatar name={person?.name ?? ""} size={22} />
                  <span className="min-w-0 flex-1 truncate">
                    {person?.name}
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {assigned} open
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}

export function TeamProjects() {
  const { teamId = "" } = useParams();
  const { projects, issues, statuses } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/teams" replace />;
  const own = projects.filter((x) => x.teamIds.includes(teamId));
  return (
    <div>
      <Header
        tabs={<TeamTabs teamId={teamId} />}
        crumbs={[
          { label: "Teams", to: "/teams" },
          { label: team.name, to: `/team/${teamId}` },
          { label: "Projects" },
        ]}
      />
      <div className="px-4 py-6 md:px-6">
        <h1 className="sr-only">{team.name} projects</h1>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {own.map((x) => {
            const p = progress(
              issues.filter((i) => i.projectId === x.id),
              [...statuses.eng, ...statuses.des],
            );
            return (
              <li key={x.id}>
                <Link
                  to={`/projects/${x.id}`}
                  className={cx(
                    "grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-4 px-4 py-3 text-[13px] hover:bg-slate-50",
                    t.focus,
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{x.name}</span>
                    <span className="block text-xs text-slate-500">
                      Target {formatDate(x.target)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Bar pct={p.pct} />
                    <span className="w-8 text-right text-xs text-slate-500 tabular-nums">
                      {p.pct}%
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
