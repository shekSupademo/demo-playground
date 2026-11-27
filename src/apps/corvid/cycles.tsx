import { Check, Search } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, formatDate } from "../../kit";
import { cx, Dialog } from "../../ui";
import { type Cycle, cycles, teams } from "./data";
import { IssueCollection } from "./issues";
import { type Issue, progress } from "./model";
import { Bar, Header, PriorityIcon, StatusIcon, t } from "./parts";
import { defaultDisplay, useStore } from "./store";

const today = () => new Date().toISOString().slice(0, 10);
const phase = (c: Cycle) =>
  c.end < today() ? "Completed" : c.start > today() ? "Upcoming" : "Current";

export function CyclesList() {
  const { teamId = "" } = useParams();
  const { issues, statuses } = useStore();
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/" replace />;
  const own = cycles
    .filter((c) => c.teamId === teamId)
    .sort((a, b) => b.number - a.number);
  return (
    <div>
      <Header
        crumbs={[
          { label: team.name, to: `/team/${teamId}/issues` },
          { label: "Cycles" },
        ]}
      />
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold">Cycles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Two-week cycles. Unfinished issues move to the next cycle when one
          ends.
        </p>
        <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {own.map((c) => {
            const scope = issues.filter((i) => i.cycleId === c.id);
            const p = progress(scope, statuses[teamId]);
            const state = phase(c);
            return (
              <li key={c.id}>
                <Link
                  to={`/team/${teamId}/cycles/${c.id}`}
                  data-testid={`cycle-${c.id}`}
                  className={cx(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-4 py-4 hover:bg-slate-50 sm:grid-cols-[12rem_minmax(0,1fr)_8rem]",
                    t.focus,
                  )}
                >
                  <span>
                    <span className="flex items-center gap-2 font-medium">
                      Cycle {c.number}
                      <Badge
                        tone={
                          state === "Current"
                            ? "info"
                            : state === "Completed"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {state}
                      </Badge>
                    </span>
                    <span className="block text-xs text-slate-500">
                      {formatDate(c.start)} to {formatDate(c.end)}
                    </span>
                  </span>
                  <span className="hidden sm:block">
                    <Bar pct={p.pct} />
                  </span>
                  <span className="text-right text-sm text-slate-600 tabular-nums">
                    {p.done} of {p.total} done
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

function AddIssuesDialog({
  cycle,
  open,
  onClose,
}: {
  cycle: Cycle;
  open: boolean;
  onClose: () => void;
}) {
  const { issues, statusOf, addToCycle } = useStore();
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const candidates = issues.filter((i) => {
    const c = statusOf(i)?.category;
    return (
      i.teamId === cycle.teamId &&
      i.cycleId !== cycle.id &&
      (c === "backlog" || c === "unstarted" || c === "started") &&
      `${i.key} ${i.title}`.toLowerCase().includes(q.trim().toLowerCase())
    );
  });
  const close = () => {
    setPicked([]);
    setQ("");
    onClose();
  };
  const toggle = (id: string) =>
    setPicked((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id],
    );
  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Add issues to Cycle ${cycle.number}`}
      className={cx(t.dialog, "max-w-xl")}
    >
      <label className="relative mt-3 block">
        <span className="sr-only">Search issues</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          className={cx(t.input, "pl-9")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search backlog and open issues"
        />
      </label>
      <ul className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        {candidates.map((i: Issue) => {
          const on = picked.includes(i.id);
          return (
            <li key={i.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                data-testid={`pick-${i.key}`}
                onClick={() => toggle(i.id)}
                className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-slate-50"
              >
                <span
                  className={cx(
                    "grid size-4 shrink-0 place-items-center rounded border",
                    on
                      ? "border-[#3046C5] bg-[#3046C5] text-white"
                      : "border-slate-300",
                  )}
                >
                  {on && <Check className="size-3" aria-hidden />}
                </span>
                <PriorityIcon value={i.priority} />
                <span className="w-16 shrink-0 text-slate-500">{i.key}</span>
                <StatusIcon category={statusOf(i)?.category ?? "backlog"} />
                <span className="min-w-0 flex-1 truncate">{i.title}</span>
                {i.estimate && (
                  <span className="text-xs text-slate-400 tabular-nums">
                    {i.estimate} pts
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {candidates.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-slate-500">
            No open issues match.
          </li>
        )}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm text-slate-500 tabular-nums">
          {picked.length} selected
        </span>
        <div className="flex gap-2">
          <button type="button" className={t.secondary} onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className={t.primary}
            disabled={picked.length === 0}
            data-testid="confirm-add-issues"
            onClick={() => {
              addToCycle(picked, cycle.id);
              close();
            }}
          >
            Add {picked.length || ""} {picked.length === 1 ? "issue" : "issues"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function BurnUp({
  total,
  done,
  cycle,
}: {
  total: number;
  done: number;
  cycle: Cycle;
}) {
  const days = 14;
  const elapsed = Math.min(
    days,
    Math.max(
      0,
      Math.round((Date.now() - new Date(cycle.start).getTime()) / 86400000),
    ),
  );
  const x = (d: number) => 8 + (d / days) * 284;
  const y = (n: number) => 112 - (total ? (n / total) * 100 : 0);
  const points = Array.from(
    { length: elapsed + 1 },
    (_, d) =>
      `${x(d)},${y(Math.round((done * d * d) / Math.max(1, elapsed * elapsed)))}`,
  ).join(" ");
  return (
    <svg
      viewBox="0 0 300 120"
      className="h-32 w-full"
      role="img"
      aria-label={`${done} of ${total} issues completed, day ${elapsed} of ${days}`}
    >
      <line
        x1={x(0)}
        y1={y(0)}
        x2={x(days)}
        y2={y(total)}
        stroke="#CBD5E1"
        strokeDasharray="4 4"
      />
      <line
        x1={x(0)}
        y1={y(total)}
        x2={x(days)}
        y2={y(total)}
        stroke="#94A3B8"
      />
      <polyline points={points} fill="none" stroke="#3046C5" strokeWidth="2" />
      <line x1={x(elapsed)} y1="8" x2={x(elapsed)} y2="114" stroke="#E2E8F0" />
    </svg>
  );
}

export function CycleDetail() {
  const { teamId = "", cycleId } = useParams();
  const { issues, statuses, v } = useStore();
  const [adding, setAdding] = useState(false);
  const team = teams.find((x) => x.id === teamId);
  const cycle = cycles.find((c) => c.id === cycleId && c.teamId === teamId);
  if (!team || !cycle)
    return <Navigate to={`/team/${teamId}/cycles`} replace />;
  const scope = issues.filter((i) => i.cycleId === cycle.id);
  const p = progress(scope, statuses[teamId]);
  const started = scope.filter(
    (i) =>
      statuses[teamId].find((s) => s.id === i.statusId)?.category === "started",
  ).length;
  const points = scope.reduce((s, i) => s + (i.estimate ?? 0), 0);
  return (
    <div className="flex min-h-full flex-col">
      <Header
        crumbs={[
          { label: team.name, to: `/team/${teamId}/issues` },
          { label: "Cycles", to: `/team/${teamId}/cycles` },
          {
            label: `Cycle ${cycle.number}`,
            to: `/team/${teamId}/cycles/${cycle.id}`,
            testId: `crumb-cycle-${cycle.number}`,
          },
        ]}
        actions={
          !v && phase(cycle) !== "Completed" ? (
            <button
              type="button"
              className={t.secondary}
              onClick={() => setAdding(true)}
              data-testid="add-cycle-issues"
            >
              Add issues
            </button>
          ) : undefined
        }
      />
      <div className="grid gap-6 border-b border-slate-200 px-4 py-5 md:grid-cols-[minmax(0,1fr)_20rem] md:px-6">
        <div>
          <h1 className="text-lg font-semibold">Cycle {cycle.number}</h1>
          <p className="text-sm text-slate-500">
            {formatDate(cycle.start)} to {formatDate(cycle.end)},{" "}
            {phase(cycle).toLowerCase()}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [
                "Scope",
                <span key="s" data-testid="cycle-scope">
                  {scope.length}
                </span>,
              ],
              ["Started", started],
              ["Completed", `${p.done} (${p.pct}%)`],
              ["Points", points],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <BurnUp total={scope.length} done={p.done} cycle={cycle} />
      </div>
      <IssueCollection
        issues={scope}
        display={defaultDisplay}
        teamId={teamId}
      />
      <AddIssuesDialog
        cycle={cycle}
        open={adding}
        onClose={() => setAdding(false)}
      />
    </div>
  );
}
