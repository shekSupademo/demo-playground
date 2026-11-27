import { ChevronRight, Target } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Avatar, Badge, formatDate } from "../../kit";
import { cx } from "../../ui";
import { initiatives, people } from "./data";
import { type Issue, progress } from "./model";
import { Bar, Header, t } from "./parts";
import { useStore } from "./store";

const healthTone = {
  "On track": "success",
  "At risk": "warning",
  "Off track": "danger",
} as const;

function useProgress() {
  const { issues, statuses } = useStore();
  const all = [...statuses.eng, ...statuses.des];
  return (projectIds: string[]) =>
    progress(
      issues.filter(
        (i: Issue) => i.projectId !== null && projectIds.includes(i.projectId),
      ),
      all,
    );
}

export function InitiativesList() {
  const prog = useProgress();
  return (
    <div>
      <Header crumbs={[{ label: "Initiatives" }]} />
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold">Initiatives</h1>
        <p className="mt-1 text-sm text-slate-500">
          Company goals for the next two quarters, and the projects that deliver
          them.
        </p>
        <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {initiatives.map((x) => {
            const p = prog(x.projectIds);
            const owner = people.find((pp) => pp.id === x.ownerId);
            return (
              <li key={x.id}>
                <Link
                  to={`/initiatives/${x.id}`}
                  data-testid={`initiative-${x.id}`}
                  className={cx(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-4 py-4 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_9rem_auto]",
                    t.focus,
                  )}
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <Target
                      className="mt-0.5 size-4 shrink-0 text-[#3046C5]"
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {x.name}
                      </span>
                      <span
                        className="block truncate text-xs text-slate-500"
                        title={x.summary}
                      >
                        {x.projectIds.length} projects, owned by {owner?.name}
                      </span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-2 sm:flex">
                    <Bar pct={p.pct} />
                    <span className="w-8 text-right text-xs text-slate-500 tabular-nums">
                      {p.pct}%
                    </span>
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

export function InitiativeDetail() {
  const { initiativeId } = useParams();
  const { projects } = useStore();
  const prog = useProgress();
  const initiative = initiatives.find((x) => x.id === initiativeId);
  if (!initiative) return <Navigate to="/initiatives" replace />;
  const owner = people.find((p) => p.id === initiative.ownerId);
  const own = projects.filter((p) => initiative.projectIds.includes(p.id));
  return (
    <div>
      <Header
        crumbs={[
          { label: "Initiatives", to: "/initiatives" },
          { label: initiative.name },
        ]}
      />
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {initiative.name}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          {initiative.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-600">
          <span className="flex items-center gap-2">
            <Avatar name={owner?.name ?? ""} size={18} />
            {owner?.name}
          </span>
          <span>Target {formatDate(initiative.target)}</span>
          <span className="tabular-nums">
            {prog(initiative.projectIds).pct}% complete
          </span>
        </div>
        <h2 className="mt-8 text-[13px] font-medium">Projects</h2>
        <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {own.map((p) => {
            const pr = prog([p.id]);
            const health = p.updates[0]?.health;
            return (
              <li key={p.id}>
                <Link
                  to={`/projects/${p.id}`}
                  data-testid={`project-${p.id}`}
                  className={cx(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-4 py-4 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_7rem_9rem]",
                    t.focus,
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {p.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {p.state}, target {formatDate(p.target)}
                    </span>
                  </span>
                  <span>
                    {health ? (
                      <Badge tone={healthTone[health]}>{health}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">No updates</span>
                    )}
                  </span>
                  <span className="hidden items-center gap-2 sm:flex">
                    <Bar pct={pr.pct} />
                    <span className="w-8 text-right text-xs text-slate-500 tabular-nums">
                      {pr.pct}%
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
