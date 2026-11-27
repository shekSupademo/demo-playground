import { Inbox } from "lucide-react";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { EmptyState, relativeTime } from "../../kit";
import { cx } from "../../ui";
import { teams } from "./data";
import {
  AssigneeMenu,
  CycleMenu,
  Header,
  LabelsMenu,
  PriorityMenu,
  PropRow,
  t,
} from "./parts";
import { useStore } from "./store";
import { TeamTabs } from "./teams";

export function Triage() {
  const { teamId = "" } = useParams();
  const { issues, statusOf, updateIssue, toast } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/" replace />;
  const queue = issues
    .filter((i) => i.teamId === teamId && statusOf(i)?.category === "triage")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const current = queue.find((i) => i.id === selected) ?? queue[0];
  const move = (statusId: string, verb: string) => {
    if (!current) return;
    updateIssue(current.id, { statusId }, verb);
    toast(
      statusId === "todo"
        ? `${current.key} moved to Todo`
        : statusId === "backlog"
          ? `${current.key} moved to Backlog`
          : `${current.key} declined`,
    );
    setSelected(null);
  };
  return (
    <div className="flex min-h-full flex-col">
      <Header
        tabs={<TeamTabs teamId={teamId} />}
        crumbs={[
          { label: "Teams", to: "/teams" },
          { label: team.name, to: `/team/${teamId}` },
          { label: "Triage" },
        ]}
      />
      <h1 className="sr-only">Triage</h1>
      {queue.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="Triage is clear"
          body="New issues from customers and other teams land here first."
        />
      ) : (
        <div className="grid flex-1 md:grid-cols-[20rem_minmax(0,1fr)]">
          <ul className="border-b border-slate-200 md:border-r md:border-b-0">
            {queue.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  data-testid="triage-item"
                  aria-current={i.id === current?.id}
                  onClick={() => setSelected(i.id)}
                  className={cx(
                    "block w-full border-b border-slate-100 px-4 py-3 text-left text-[13px]",
                    t.focus,
                    i.id === current?.id ? "bg-[#EEF0FC]" : "hover:bg-slate-50",
                  )}
                >
                  <span className="flex justify-between text-xs text-slate-500">
                    {i.key}
                    <span>{relativeTime(i.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 font-medium">
                    {i.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {current && (
            <section className="px-4 py-6 md:px-8">
              <p className="text-xs text-slate-500">
                {current.key}, reported {relativeTime(current.createdAt)}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {current.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm whitespace-pre-line text-slate-700">
                {current.description || "No description."}
              </p>
              <div className="mt-6 flex max-w-sm flex-col gap-2">
                <PropRow label="Priority">
                  <PriorityMenu issue={current} withLabel />
                </PropRow>
                <PropRow label="Assignee">
                  <AssigneeMenu issue={current} withLabel />
                </PropRow>
                <PropRow label="Labels">
                  <LabelsMenu issue={current} />
                </PropRow>
                <PropRow label="Cycle">
                  <CycleMenu issue={current} />
                </PropRow>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={t.primary}
                  onClick={() => move("todo", "accepted the issue into Todo")}
                  data-testid="triage-accept"
                >
                  Accept to Todo
                </button>
                <button
                  type="button"
                  className={t.secondary}
                  onClick={() =>
                    move("backlog", "accepted the issue into Backlog")
                  }
                >
                  Accept to Backlog
                </button>
                <button
                  type="button"
                  className={t.secondary}
                  onClick={() => move("canceled", "declined the issue")}
                  data-testid="triage-decline"
                >
                  Decline
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
