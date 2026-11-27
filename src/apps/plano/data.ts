import { daysFromToday } from "../../kit";

export const ME = "Alex Morgan";

export const people: Record<string, string> = {
  "Alex Morgan": "Product manager",
  "Maya Chen": "Design lead",
  "Jordan Lee": "Mobile engineer",
  "Priya Patel": "Customer success lead",
  "Sam Rivera": "Head of product",
  "Daniel Okafor": "Billing engineer",
  "Hana Suzuki": "Product designer",
  "Lucas Moreau": "Technical writer",
  "Amara Nwosu": "Security engineer",
  "Elena Petrova": "Partnerships engineer",
  "Tomás Herrera": "Backend engineer",
  "Grace Kim": "QA engineer",
};

export type Task = {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  due: string;
};

export type ActivityKind =
  | "created"
  | "completed"
  | "reopened"
  | "addedTask"
  | "archived"
  | "restored";

export type Activity = {
  id: string;
  who: string;
  kind: ActivityKind;
  subject?: string;
  at: string;
};

export type Priority = "high" | "medium" | "low";

export type Project = {
  id: string;
  name: string;
  description: string;
  owner: string;
  start: string;
  due: string;
  priority: Priority;
  archived: boolean;
  members: string[];
  tasks: Task[];
  activity: Activity[];
};

export type Status = "onTrack" | "atRisk" | "overdue" | "complete";

export const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600000).toISOString();

export const byNewest = (a: Activity, b: Activity) => b.at.localeCompare(a.at);

type TaskSeed = [string, string, string, number, boolean?];

function project(
  id: string,
  name: string,
  description: string,
  owner: string,
  start: number,
  due: number,
  priority: Priority,
  members: string[],
  tasks: TaskSeed[],
): Project {
  return {
    id,
    name,
    description,
    owner,
    start: daysFromToday(start),
    due: daysFromToday(due),
    priority,
    archived: false,
    members,
    tasks: tasks.map(([taskId, title, assignee, offset, done = false]) => ({
      id: taskId,
      title,
      assignee,
      due: daysFromToday(offset),
      done,
    })),
    activity: [
      ...tasks
        .filter((task) => task[4])
        .map(
          ([taskId, title, assignee, offset]): Activity => ({
            id: `${taskId}-done`,
            who: assignee,
            kind: "completed",
            subject: title,
            at: hoursAgo(Math.max(2, -offset * 24 + 5)),
          }),
        ),
      ...tasks.map(
        ([taskId, title], index): Activity => ({
          id: `${taskId}-added`,
          who: owner,
          kind: "addedTask",
          subject: title,
          at: hoursAgo(
            Math.max(1, -start * 24 * (1 - (index + 1) / (tasks.length + 2))),
          ),
        }),
      ),
      {
        id: `${id}-created`,
        who: owner,
        kind: "created",
        at: hoursAgo(-start * 24 + 3),
      } satisfies Activity,
    ].sort(byNewest),
  };
}

export const seed: Project[] = [
  project(
    "website",
    "Website relaunch",
    "New marketing site with refreshed pricing, docs navigation and a faster blog.",
    "Maya Chen",
    -40,
    8,
    "high",
    [
      "Maya Chen",
      "Alex Morgan",
      "Hana Suzuki",
      "Lucas Moreau",
      "Tomás Herrera",
    ],
    [
      ["w1", "Write homepage copy", "Alex Morgan", -6, true],
      ["w2", "Review pricing page design", "Alex Morgan", 2],
      ["w3", "Set up redirects", "Tomás Herrera", 6],
      ["w4", "Migrate blog posts to the new CMS", "Lucas Moreau", 4],
      ["w5", "Run accessibility audit on key pages", "Hana Suzuki", 7],
    ],
  ),
  project(
    "mobile",
    "Mobile app beta",
    "Private beta of the iOS and Android apps with 20 design partners.",
    "Jordan Lee",
    -60,
    16,
    "high",
    ["Jordan Lee", "Grace Kim", "Alex Morgan", "Hana Suzuki"],
    [
      ["m1", "Recruit 20 beta testers", "Alex Morgan", 3],
      ["m2", "Fix login crash on Android", "Jordan Lee", -2, true],
      ["m3", "Set up TestFlight groups", "Grace Kim", 5],
      ["m4", "Write release notes for beta 0.9", "Alex Morgan", 9],
    ],
  ),
  project(
    "onboarding",
    "Customer onboarding",
    "Shorten time to first project for new teams from five days to two.",
    "Priya Patel",
    -25,
    3,
    "medium",
    ["Priya Patel", "Alex Morgan", "Lucas Moreau"],
    [
      ["o1", "Draft welcome email sequence", "Priya Patel", 1],
      ["o2", "Record setup walkthrough", "Lucas Moreau", 2],
      ["o3", "Review onboarding checklist copy", "Alex Morgan", -1],
    ],
  ),
  project(
    "q1",
    "Q1 planning",
    "Goals, roadmap themes and staffing for the first quarter.",
    "Sam Rivera",
    -5,
    50,
    "medium",
    ["Sam Rivera", "Alex Morgan", "Maya Chen", "Daniel Okafor"],
    [
      ["q1a", "Collect team goals", "Alex Morgan", 10],
      ["q1b", "Draft roadmap themes", "Sam Rivera", 20],
      ["q1c", "Book planning offsite venue", "Alex Morgan", -3, true],
    ],
  ),
  project(
    "billing",
    "Billing migration to usage-based pricing for self-serve plans",
    "Move self-serve customers from seat pricing to metered usage without invoice surprises.",
    "Daniel Okafor",
    -90,
    -2,
    "high",
    ["Daniel Okafor", "Tomás Herrera", "Alex Morgan", "Priya Patel"],
    [
      [
        "b1",
        "Backfill usage records for the March cohort",
        "Tomás Herrera",
        -4,
      ],
      ["b2", "Update invoice templates", "Daniel Okafor", -6, true],
      ["b3", "Sign off on pricing page changes", "Alex Morgan", -1],
      ["b4", "Notify affected customers", "Priya Patel", 2],
    ],
  ),
  project(
    "design-system",
    "Design system v2",
    "Shared tokens and components for web and mobile.",
    "Hana Suzuki",
    -70,
    5,
    "medium",
    ["Hana Suzuki", "Maya Chen", "Alex Morgan"],
    [
      ["d1", "Audit button and input variants", "Hana Suzuki", -12, true],
      ["d2", "Publish color tokens", "Maya Chen", 0, true],
      ["d3", "Document form patterns", "Hana Suzuki", 3],
      ["d4", "Review dark mode contrast", "Alex Morgan", -9, true],
    ],
  ),
  project(
    "help-center",
    "Help center rewrite",
    "Rewrite the 40 most-viewed articles and retire outdated ones.",
    "Lucas Moreau",
    -30,
    22,
    "low",
    ["Lucas Moreau", "Priya Patel"],
    [
      ["h1", "Inventory outdated articles", "Lucas Moreau", -9, true],
      ["h2", "Rewrite billing FAQ", "Lucas Moreau", 8],
      ["h3", "Add screenshots for mobile setup", "Priya Patel", 15],
    ],
  ),
  project(
    "soc2",
    "SOC 2 readiness",
    "Controls, evidence and policies for the Type II audit window.",
    "Amara Nwosu",
    -45,
    35,
    "high",
    ["Amara Nwosu", "Tomás Herrera", "Sam Rivera"],
    [
      ["s1", "Complete vendor risk assessments", "Amara Nwosu", 12],
      [
        "s2",
        "Enable audit logging for admin actions",
        "Tomás Herrera",
        -20,
        true,
      ],
      ["s3", "Collect access review evidence", "Amara Nwosu", 25],
    ],
  ),
  project(
    "android-offline",
    "Android offline mode",
    "Let field teams view and edit tasks without a connection.",
    "Jordan Lee",
    -20,
    12,
    "medium",
    ["Jordan Lee", "Grace Kim"],
    [
      ["a1", "Cache project list locally", "Jordan Lee", 4],
      ["a2", "Queue task edits while offline", "Jordan Lee", 9],
      ["a3", "Test sync conflicts", "Grace Kim", 11],
    ],
  ),
  project(
    "integrations",
    "Partner integrations: Salesforce and HubSpot sync",
    "Two-way sync of deals and tasks with the two most requested CRMs.",
    "Elena Petrova",
    -15,
    27,
    "medium",
    ["Elena Petrova", "Tomás Herrera", "Alex Morgan"],
    [
      ["i1", "Map HubSpot deal fields", "Elena Petrova", 6],
      ["i2", "Build OAuth connection flow", "Tomás Herrera", 14],
      ["i3", "Write integration setup guide", "Alex Morgan", 20],
    ],
  ),
  project(
    "survey",
    "Annual customer survey",
    "Satisfaction survey for all paying teams, with results by plan.",
    "Priya Patel",
    -10,
    1,
    "low",
    ["Priya Patel", "Sam Rivera", "Alex Morgan"],
    [
      ["v1", "Finalize survey questions", "Sam Rivera", -3, true],
      ["v2", "Send survey to customer list", "Priya Patel", 1],
      ["v3", "Pick a gift card vendor", "Alex Morgan", 0, true],
    ],
  ),
  project(
    "search",
    "Search performance",
    "Bring p95 search latency under 200 ms for large teams.",
    "Tomás Herrera",
    -35,
    19,
    "medium",
    ["Tomás Herrera", "Daniel Okafor"],
    [
      ["r1", "Profile slow queries", "Tomás Herrera", -8, true],
      ["r2", "Add trigram index for task titles", "Tomás Herrera", 6],
    ],
  ),
  project(
    "brand",
    "Brand refresh",
    "New logo, color palette and product illustrations.",
    "Maya Chen",
    -80,
    -3,
    "low",
    ["Maya Chen", "Hana Suzuki"],
    [
      ["br1", "Finalize logo lockups", "Maya Chen", -20, true],
      ["br2", "Update social profiles", "Hana Suzuki", -4, true],
    ],
  ),
];

export function progressOf(project: Project) {
  const total = project.tasks.length;
  const done = project.tasks.filter((task) => task.done).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function statusOf(project: Project): Status {
  const { total, done, pct } = progressOf(project);
  if (total > 0 && done === total) return "complete";
  if (project.due < daysFromToday(0)) return "overdue";
  if (project.due <= daysFromToday(7) && pct < 60) return "atRisk";
  return "onTrack";
}
