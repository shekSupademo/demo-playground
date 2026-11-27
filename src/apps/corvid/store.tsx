import { createContext, type ReactNode, useContext, useState } from "react";
import {
  type Comment,
  cycles,
  type Health,
  type Milestone,
  me,
  type Project,
  seedComments,
  seedIssues,
  seedMilestones,
  seedProjects,
  seedStatuses,
  teams,
} from "./data";
import type { Display, Filter, Issue, Status, StatusCategory } from "./model";

export type SavedView = {
  id: string;
  teamId: string;
  name: string;
  filters: Filter[];
  display: Display;
};
export type Activity = {
  id: string;
  issueId: string;
  actorId: string;
  text: string;
  at: string;
};

export const defaultDisplay: Display = {
  layout: "list",
  groupBy: "status",
  orderBy: "priority",
  showSubIssues: true,
  showEmptyGroups: false,
};

const nowIso = () => new Date().toISOString();
let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++seq}`;

function useStoreValue(v: boolean, toast: (message: string) => void) {
  const [issues, setIssues] = useState(seedIssues);
  const [statuses, setStatuses] = useState(seedStatuses);
  const [milestones, setMilestones] = useState(seedMilestones);
  const [projects, setProjects] = useState(seedProjects);
  const [comments, setComments] = useState(seedComments);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [newIssueOpen, setNewIssueOpen] = useState<{
    teamId: string;
    parentId?: string;
  } | null>(null);

  const log = (issueId: string, text: string) =>
    setActivity((all) => [
      ...all,
      { id: uid("act"), issueId, actorId: me, text, at: nowIso() },
    ]);

  const statusOf = (issue: Issue) =>
    statuses[issue.teamId].find((s) => s.id === issue.statusId);

  const nextKey = (teamId: string, current: Issue[]) => {
    const team = teams.find((t) => t.id === teamId) ?? teams[0];
    const max = Math.max(
      0,
      ...current
        .filter((i) => i.teamId === teamId)
        .map((i) => Number(i.key.split("-")[1])),
    );
    return `${team.key}-${max + 1}`;
  };

  function createIssue(
    fields: Partial<Issue> & { teamId: string; title: string },
  ) {
    const key = nextKey(fields.teamId, issues);
    const parent = fields.parentId
      ? issues.find((i) => i.id === fields.parentId)
      : undefined;
    const issue: Issue = {
      id: key,
      key,
      description: "",
      statusId: "todo",
      priority: parent?.priority ?? 0,
      assigneeId: null,
      labelIds: [],
      projectId: parent?.projectId ?? null,
      milestoneId: parent?.milestoneId ?? null,
      cycleId: parent?.cycleId ?? null,
      parentId: null,
      estimate: null,
      due: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...fields,
    };
    setIssues((all) => [...all, issue]);
    log(issue.id, "created the issue");
    return issue;
  }

  return {
    v,
    toast,
    issues,
    statuses,
    milestones,
    projects,
    comments,
    activity,
    views,
    commandOpen,
    setCommandOpen,
    newIssueOpen,
    setNewIssueOpen,
    statusOf,
    createIssue,
    updateIssue(id: string, patch: Partial<Issue>, note?: string) {
      setIssues((all) =>
        all.map((i) =>
          i.id === id ? { ...i, ...patch, updatedAt: nowIso() } : i,
        ),
      );
      if (note) log(id, note);
    },
    addToCycle(ids: string[], cycleId: string) {
      const cycle = cycles.find((c) => c.id === cycleId);
      setIssues((all) =>
        all.map((i) =>
          ids.includes(i.id) ? { ...i, cycleId, updatedAt: nowIso() } : i,
        ),
      );
      for (const id of ids)
        log(id, `added the issue to Cycle ${cycle?.number}`);
      toast(
        `${ids.length} ${ids.length === 1 ? "issue" : "issues"} added to Cycle ${cycle?.number}`,
      );
    },
    addComment(issueId: string, body: string) {
      setComments((all) => [
        ...all,
        {
          id: uid("c"),
          issueId,
          authorId: me,
          body,
          at: nowIso(),
        } satisfies Comment,
      ]);
      toast("Comment added");
    },
    addMilestone(projectId: string, name: string, target: string | null) {
      setMilestones((all) => [
        ...all,
        { id: uid("m"), projectId, name, target } satisfies Milestone,
      ]);
      toast(`${name} created`);
    },
    postUpdate(projectId: string, health: Health, body: string) {
      setProjects((all) =>
        all.map(
          (p): Project =>
            p.id === projectId
              ? {
                  ...p,
                  updates: [
                    { id: uid("u"), authorId: me, health, body, at: nowIso() },
                    ...p.updates,
                  ],
                }
              : p,
        ),
      );
      toast("Project update posted");
    },
    addStatus(teamId: string, name: string, category: StatusCategory) {
      const status: Status = { id: uid("status"), name, category };
      setStatuses((all) => {
        const list = all[teamId];
        const at = list.map((s) => s.category).lastIndexOf(category);
        const order: StatusCategory[] = [
          "triage",
          "backlog",
          "unstarted",
          "started",
          "completed",
          "canceled",
        ];
        const insertAt =
          at >= 0
            ? at + 1
            : list.filter(
                (s) => order.indexOf(s.category) < order.indexOf(category),
              ).length;
        return {
          ...all,
          [teamId]: [
            ...list.slice(0, insertAt),
            status,
            ...list.slice(insertAt),
          ],
        };
      });
      toast(`${name} added`);
    },
    saveView(view: Omit<SavedView, "id">) {
      const saved = { ...view, id: uid("view") };
      setViews((all) => [...all, saved]);
      toast(`${view.name} saved`);
      return saved;
    },
    deleteView(id: string) {
      setViews((all) => all.filter((x) => x.id !== id));
      toast("View deleted");
    },
  };
}

export type Store = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  v,
  toast,
  children,
}: {
  v: boolean;
  toast: (m: string) => void;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={useStoreValue(v, toast)}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore needs StoreProvider");
  return store;
}
