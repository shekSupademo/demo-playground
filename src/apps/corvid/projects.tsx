import { Diamond, Plus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Avatar, Badge, formatDate, relativeTime } from "../../kit";
import { cx, Dialog } from "../../ui";
import { initiatives, type Health, type Milestone, people, teams } from "./data";
import { IssueCollection } from "./issues";
import { progress } from "./model";
import { Bar, Header, PropRow, Tabs, t, useTab } from "./parts";
import { defaultDisplay, useStore } from "./store";

const healthTone = {
  "On track": "success",
  "At risk": "warning",
  "Off track": "danger",
} as const;

function useProjectProgress() {
  const { issues, statuses } = useStore();
  return (projectId: string, milestoneId?: string) =>
    progress(
      issues.filter(
        (i) =>
          i.projectId === projectId &&
          (milestoneId === undefined || i.milestoneId === milestoneId),
      ),
      [...statuses.eng, ...statuses.des],
    );
}

export function ProjectsList() {
  const { projects } = useStore();
  const prog = useProjectProgress();
  return (
    <div>
      <Header crumbs={[{ label: "Projects" }]} />
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          Work that spans cycles and teams, with a target date.
        </p>
        <div className="relative mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[44rem] text-left text-[13px]">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Health</th>
                <th className="px-4 py-2 font-medium">Lead</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="w-40 px-4 py-2 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
                const pr = prog(p.id);
                const health = p.updates[0]?.health;
                const lead = people.find((x) => x.id === p.leadId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/projects/${p.id}`}
                        data-testid={`project-${p.id}`}
                        className={cx(
                          "font-medium hover:text-[#3046C5]",
                          t.focus,
                        )}
                      >
                        {p.name}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {p.state}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {health ? (
                        <Badge tone={healthTone[health]}>{health}</Badge>
                      ) : (
                        <span className="text-slate-400">No updates</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={lead?.name ?? ""} size={20} />
                        {lead?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(p.target)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Bar pct={pr.pct} />
                        <span className="w-9 text-right text-xs text-slate-500 tabular-nums">
                          {pr.pct}%
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MilestoneDialog({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { addMilestone } = useStore();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [touched, setTouched] = useState(false);
  const close = () => {
    setName("");
    setDate("");
    setTouched(false);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title="New milestone"
      className={t.dialog}
    >
      <form
        className="mt-3 flex flex-col gap-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!name.trim()) return;
          addMilestone(projectId, name.trim(), date || null);
          close();
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Name</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Beta with customers"
            aria-invalid={touched && !name.trim()}
            data-testid="milestone-name"
          />
        </label>
        {touched && !name.trim() && (
          <p className="text-sm text-rose-600">Enter a milestone name</p>
        )}
        <label className="text-sm">
          <span className="font-medium">Target date</span>
          <span className="ml-1 text-slate-500">(optional)</span>
          <input
            type="date"
            className={cx(t.input, "mt-1.5")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="milestone-date"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={close}>
            Cancel
          </button>
          <button
            type="submit"
            className={t.primary}
            data-testid="save-milestone"
          >
            Create milestone
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function MilestoneList({
  projectId,
  compact,
}: {
  projectId: string;
  compact?: boolean;
}) {
  const { milestones } = useStore();
  const prog = useProjectProgress();
  const own = milestones.filter((m) => m.projectId === projectId);
  return (
    <ul
      data-testid="milestones"
      className={cx(
        "flex flex-col",
        compact
          ? "gap-2"
          : "divide-y divide-slate-100 rounded-lg border border-slate-200",
      )}
    >
      {own.length === 0 && (
        <li className="px-4 py-6 text-center text-sm text-slate-500">
          No milestones yet.
        </li>
      )}
      {own.map((m: Milestone) => {
        const p = prog(projectId, m.id);
        return (
          <li
            key={m.id}
            className={cx(
              "flex items-center gap-3 text-[13px]",
              !compact && "px-4 py-3",
            )}
          >
            <Diamond
              className={cx(
                "size-3.5 shrink-0",
                p.pct === 100 && p.total > 0
                  ? "fill-[#3046C5] text-[#3046C5]"
                  : "text-slate-400",
              )}
              aria-hidden
            />
            <span
              className="min-w-0 flex-1 truncate font-medium"
              title={m.name}
            >
              {m.name}
            </span>
            {!compact && (
              <span className="w-28 text-xs text-slate-500">
                {m.target ? formatDate(m.target) : "No target date"}
              </span>
            )}
            <span className="w-16 text-right text-xs text-slate-500 tabular-nums">
              {p.done}/{p.total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function UpdateComposer({ projectId }: { projectId: string }) {
  const { postUpdate } = useStore();
  const [health, setHealth] = useState<Health>("On track");
  const [body, setBody] = useState("");
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        postUpdate(projectId, health, body.trim());
        setBody("");
      }}
    >
      <label>
        <span className="sr-only">Project update</span>
        <textarea
          className={cx(t.input, "min-h-20 border-0 px-1 focus:outline-0")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a project update"
        />
      </label>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[13px]">
          <span className="text-slate-500">Health</span>
          <select
            className={cx(t.input, "w-32 py-1")}
            value={health}
            onChange={(e) => setHealth(e.target.value as Health)}
          >
            <option>On track</option>
            <option>At risk</option>
            <option>Off track</option>
          </select>
        </label>
        <button type="submit" className={t.primary} disabled={!body.trim()}>
          Post update
        </button>
      </div>
    </form>
  );
}

export function ProjectDetail() {
  const { projectId } = useParams();
  const { projects, issues, v } = useStore();
  const tabs = v
    ? (["overview", "issues"] as const)
    : (["overview", "issues", "milestones"] as const);
  const [tab, setTab] = useTab<"overview" | "issues" | "milestones">(tabs);
  const [adding, setAdding] = useState(false);
  const prog = useProjectProgress();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/projects" replace />;
  const lead = people.find((x) => x.id === project.leadId);
  const initiative = initiatives.find((x) => x.projectIds.includes(project.id));
  const pr = prog(project.id);
  return (
    <div className="flex min-h-full flex-col">
      <Header
        crumbs={[
          { label: "Initiatives", to: "/initiatives" },
          ...(initiative ? [{ label: initiative.name, to: `/initiatives/${initiative.id}` }] : []),
          { label: project.name },
        ]}
      />
      <div className="border-b border-slate-200 px-4 pt-5 pb-3 md:px-6">
        <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          {project.summary}
        </p>
        <div className="mt-4">
          <Tabs
            tabs={tabs}
            current={tab}
            onChange={setTab}
            labels={{
              overview: "Overview",
              issues: "Issues",
              milestones: "Milestones",
            }}
          />
        </div>
      </div>
      {tab === "overview" && (
        <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 px-4 py-6 md:px-6">
            <h2 className="text-[13px] font-medium">Updates</h2>
            <div className="mt-3 flex flex-col gap-4">
              <UpdateComposer projectId={project.id} />
              {project.updates.map((u) => {
                const author = people.find((p) => p.id === u.authorId);
                return (
                  <article
                    key={u.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Badge tone={healthTone[u.health]}>{u.health}</Badge>
                      <Avatar name={author?.name ?? ""} size={18} />
                      <span className="font-medium text-slate-700">
                        {author?.name}
                      </span>
                      {relativeTime(u.at)}
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{u.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <aside className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-5 lg:border-t-0 lg:border-l">
            <PropRow label="Status">{project.state}</PropRow>
            <PropRow label="Lead">
              <span className="flex items-center gap-2">
                <Avatar name={lead?.name ?? ""} size={18} />
                {lead?.name}
              </span>
            </PropRow>
            <PropRow label="Teams">
              {project.teamIds
                .map((id) => teams.find((x) => x.id === id)?.name)
                .join(", ")}
            </PropRow>
            <PropRow label="Start">{formatDate(project.start)}</PropRow>
            <PropRow label="Target">{formatDate(project.target)}</PropRow>
            <PropRow label="Progress">
              <span className="flex items-center gap-2">
                <Bar pct={pr.pct} />
                <span className="text-xs tabular-nums">{pr.pct}%</span>
              </span>
            </PropRow>
            {v && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[13px] font-medium">Milestones</h2>
                  <button
                    type="button"
                    className={cx(t.ghost, "size-7")}
                    aria-label="Add milestone"
                    onClick={() => setAdding(true)}
                    data-testid="add-milestone"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
                <MilestoneList projectId={project.id} compact />
              </div>
            )}
          </aside>
        </div>
      )}
      {tab === "issues" && (
        <IssueCollection
          issues={issues.filter((i) => i.projectId === project.id)}
          display={defaultDisplay}
          teamId={project.teamIds[0]}
        />
      )}
      {tab === "milestones" && (
        <div className="px-4 py-6 md:px-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Milestones split the project into stages you can track separately.
            </p>
            <button
              type="button"
              className={t.primary}
              onClick={() => setAdding(true)}
              data-testid="add-milestone"
            >
              <Plus className="size-4" aria-hidden /> Add milestone
            </button>
          </div>
          <MilestoneList projectId={project.id} />
        </div>
      )}
      <MilestoneDialog
        projectId={project.id}
        open={adding}
        onClose={() => setAdding(false)}
      />
    </div>
  );
}
