import { CalendarDays, Link2, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Avatar, relativeTime } from "../../kit";
import { cx, Dialog, Menu } from "../../ui";
import { people, teams } from "./data";
import { progress } from "./model";
import {
  AssigneeMenu,
  CycleMenu,
  Header,
  LabelsMenu,
  MilestoneMenu,
  PriorityMenu,
  ProgressRing,
  ProjectMenu,
  PropRow,
  StatusMenu,
  t,
} from "./parts";
import { useStore } from "./store";

function SubIssueForm({
  onSave,
  onCancel,
}: {
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!title.trim()) return;
        onSave(title.trim());
        setTitle("");
        setTouched(false);
      }}
    >
      <label className="text-sm">
        <span className="sr-only">Sub-issue title</span>
        <input
          autoFocus
          className={t.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sub-issue title"
          aria-invalid={touched && !title.trim()}
          data-testid="sub-issue-title"
        />
      </label>
      {touched && !title.trim() && (
        <p className="text-sm text-rose-600">Enter a title</p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={t.secondary} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className={t.primary}
          data-testid="save-sub-issue"
        >
          Create sub-issue
        </button>
      </div>
    </form>
  );
}

export function IssueDetail() {
  const { key = "" } = useParams();
  const store = useStore();
  const {
    issues,
    statuses,
    comments,
    activity,
    v,
    createIssue,
    updateIssue,
    addComment,
    toast,
  } = store;
  const issue = issues.find((i) => i.key === key);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(!v);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  if (!issue) return <Navigate to="/" replace />;
  const team = teams.find((x) => x.id === issue.teamId) ?? teams[0];
  const parent = issues.find((i) => i.id === issue.parentId);
  const subs = issues.filter((i) => i.parentId === issue.id);
  const sub = progress(subs, statuses[issue.teamId]);
  const own = comments.filter((c) => c.issueId === issue.key);
  const history = activity.filter((a) => a.issueId === issue.id);
  const addSub = (title: string) => {
    createIssue({ teamId: issue.teamId, title, parentId: issue.id });
    toast("Sub-issue created");
    setAdding(false);
  };
  const timeline = [
    {
      id: "created",
      at: issue.createdAt,
      node: (
        <>
          <b className="font-medium text-slate-700">
            {people.find((p) => p.id === team.members[Number(issue.key.split("-")[1]) % team.members.length])?.name}
          </b>{" "}
          created the issue
        </>
      ),
    },
    ...own.map((c) => ({
      id: c.id,
      at: c.at,
      node: (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-slate-800">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <Avatar
              name={people.find((p) => p.id === c.authorId)?.name ?? ""}
              size={18}
            />
            <span className="font-medium text-slate-700">
              {people.find((p) => p.id === c.authorId)?.name}
            </span>
            {relativeTime(c.at)}
          </div>
          <p className="text-sm whitespace-pre-line">{c.body}</p>
        </div>
      ),
    })),
    ...history.map((a) => ({
      id: a.id,
      at: a.at,
      node: (
        <>
          <b className="font-medium text-slate-700">
            {people.find((p) => p.id === a.actorId)?.name}
          </b>{" "}
          {a.text}
        </>
      ),
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="flex min-h-full flex-col">
      <Header
        crumbs={[
          { label: team.name, to: `/team/${team.id}/issues` },
          ...(parent
            ? [{ label: parent.key, to: `/issue/${parent.key}` }]
            : []),
          { label: issue.key },
        ]}
        actions={
          <Menu
            label={`More actions for ${issue.key}`}
            trigger={<MoreHorizontal className="size-4" aria-hidden />}
            triggerClassName={t.ghost}
            testId="issue-actions"
            items={[
              ...(v
                ? [
                    {
                      label: "Add sub-issue",
                      testId: "menu-add-sub-issue",
                      onSelect: () => setAdding(true),
                    },
                  ]
                : []),
              {
                label: "Copy issue link",
                onSelect: () => toast(`Link to ${issue.key} copied`),
              },
              {
                label: "Subscribe",
                onSelect: () => toast(`Subscribed to ${issue.key}`),
              },
            ]}
          />
        }
      />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 px-4 py-6 md:px-10">
          {parent && (
            <Link
              to={`/issue/${parent.key}`}
              className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"
            >
              Sub-issue of{" "}
              <span className="font-medium text-slate-700">
                {parent.key} {parent.title}
              </span>
            </Link>
          )}
          <h1
            className="text-xl font-semibold tracking-tight"
            data-testid="issue-title"
          >
            {issue.title}
          </h1>
          {editing ? (
            <div className="mt-3 flex flex-col gap-2">
              <label>
                <span className="sr-only">Description</span>
                <textarea
                  className={cx(t.input, "min-h-32")}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className={t.secondary}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={t.primary}
                  onClick={() => {
                    updateIssue(
                      issue.id,
                      { description: draft },
                      "updated the description",
                    );
                    setEditing(false);
                    toast("Description saved");
                  }}
                >
                  Save description
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={cx(
                "mt-3 block w-full rounded-md px-1 py-1 text-left text-sm whitespace-pre-line hover:bg-slate-50",
                t.focus,
                issue.description ? "text-slate-700" : "text-slate-400",
              )}
              onClick={() => {
                setDraft(issue.description);
                setEditing(true);
              }}
            >
              {issue.description || "Add a description"}
            </button>
          )}

          <details
            data-testid="sub-issues"
            open={open}
            onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
            className="mt-8 rounded-lg border border-slate-200"
          >
            <summary
              className={cx(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-medium",
                t.focus,
              )}
              data-testid="sub-issues-toggle"
            >
              Sub-issues
              <ProgressRing pct={sub.pct} />
              <span
                className="text-slate-500 tabular-nums"
                data-testid="sub-issue-progress"
              >
                {sub.done}/{sub.total}
              </span>
            </summary>
            <ul className="border-t border-slate-100">
              {subs.map((s) => (
                <li
                  key={s.id}
                  data-testid="sub-issue-row"
                  className="flex h-10 items-center gap-2 border-b border-slate-100 px-3 text-[13px] last:border-b-0"
                >
                  <StatusMenu issue={s} />
                  <span className="w-16 shrink-0 text-slate-500 tabular-nums">
                    {s.key}
                  </span>
                  <Link
                    to={`/issue/${s.key}`}
                    className={cx("min-w-0 flex-1 truncate rounded", t.focus)}
                  >
                    {s.title}
                  </Link>
                  <AssigneeMenu issue={s} />
                </li>
              ))}
              {subs.length === 0 && (
                <li className="px-3 py-3 text-[13px] text-slate-500">
                  Split this issue into smaller pieces that can ship on their
                  own.
                </li>
              )}
            </ul>
            {!v && (
              <div className="border-t border-slate-100 p-2">
                {adding ? (
                  <SubIssueForm
                    onSave={addSub}
                    onCancel={() => setAdding(false)}
                  />
                ) : (
                  <button
                    type="button"
                    className={cx(t.chip, "border-transparent")}
                    onClick={() => setAdding(true)}
                    data-testid="add-sub-issue"
                  >
                    <Plus className="size-3.5" aria-hidden /> Add sub-issue
                  </button>
                )}
              </div>
            )}
          </details>
          {v && (
            <Dialog
              open={adding}
              onClose={() => setAdding(false)}
              title={`New sub-issue of ${issue.key}`}
              className={t.dialog}
            >
              <p className="mt-1 mb-3 text-sm text-slate-500">
                Sub-issues take the parent's project, cycle and priority.
              </p>
              {adding && (
                <SubIssueForm
                  onSave={addSub}
                  onCancel={() => setAdding(false)}
                />
              )}
            </Dialog>
          )}

          <section className="mt-10">
            <h2 className="text-[13px] font-medium">Activity</h2>
            <ol className="mt-3 flex flex-col gap-3 text-[13px] text-slate-500">
              {timeline.map((e) => (
                <li key={e.id} className="flex flex-col gap-1">
                  <div>{e.node}</div>
                  {!own.some((c) => c.id === e.id) && <span className="text-xs text-slate-400">{relativeTime(e.at)}</span>}
                </li>
              ))}
            </ol>
            <form
              className="mt-4 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                addComment(issue.key, comment.trim());
                setComment("");
              }}
            >
              <label>
                <span className="sr-only">Leave a comment</span>
                <textarea
                  className={cx(t.input, "min-h-20")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave a comment"
                  data-testid="comment-input"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={t.primary}
                  disabled={!comment.trim()}
                  data-testid="post-comment"
                >
                  Comment
                </button>
              </div>
            </form>
          </section>
        </div>
        <aside className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-5 lg:border-t-0 lg:border-l">
          <PropRow label="Status">
            <StatusMenu issue={issue} withLabel />
          </PropRow>
          <PropRow label="Priority">
            <PriorityMenu issue={issue} withLabel />
          </PropRow>
          <PropRow label="Assignee">
            <AssigneeMenu issue={issue} withLabel />
          </PropRow>
          <PropRow label="Labels">
            <LabelsMenu issue={issue} />
          </PropRow>
          <div className="my-2 border-t border-slate-200" />
          <PropRow label="Project">
            <ProjectMenu issue={issue} />
          </PropRow>
          {issue.projectId && (
            <PropRow label="Milestone">
              <MilestoneMenu issue={issue} />
            </PropRow>
          )}
          <PropRow label="Cycle">
            <CycleMenu issue={issue} />
          </PropRow>
          <PropRow label="Estimate">
            <select
              aria-label="Estimate"
              className="rounded-md bg-transparent px-1 py-1 text-[13px] hover:bg-slate-100"
              value={issue.estimate ?? ""}
              onChange={(e) =>
                updateIssue(
                  issue.id,
                  { estimate: e.target.value ? Number(e.target.value) : null },
                  `set the estimate to ${e.target.value || "none"}`,
                )
              }
            >
              <option value="">No estimate</option>
              {[1, 2, 3, 5, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "point" : "points"}
                </option>
              ))}
            </select>
          </PropRow>
          <PropRow label="Due date">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-slate-400" aria-hidden />
              <input
                type="date"
                aria-label="Due date"
                className="rounded-md bg-transparent px-1 py-0.5 text-[13px] hover:bg-slate-100"
                value={issue.due ?? ""}
                onChange={(e) =>
                  updateIssue(
                    issue.id,
                    { due: e.target.value || null },
                    e.target.value ? "set a due date" : "removed the due date",
                  )
                }
              />
            </span>
          </PropRow>
          <div className="my-2 border-t border-slate-200" />
          <button
            type="button"
            className={cx(t.chip, "self-start")}
            onClick={() =>
              toast("Branch name copied: maya/" + issue.key.toLowerCase())
            }
          >
            <Link2 className="size-3.5" aria-hidden /> Copy branch name
          </button>
        </aside>
      </div>
    </div>
  );
}

export function IssuePage() {
  const { key } = useParams();
  return <IssueDetail key={key} />;
}
