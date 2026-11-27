export type Range = "7d" | "30d" | "90d" | "12m";
export type Unit = "count" | "money" | "pct" | "minutes";
export type Point = { label: string; value: number; previous?: number };

export const ranges: {
  id: Range;
  label: string;
  short: string;
  days: number;
}[] = [
  { id: "7d", label: "Last 7 days", short: "7D", days: 7 },
  { id: "30d", label: "Last 30 days", short: "30D", days: 30 },
  { id: "90d", label: "Last 90 days", short: "90D", days: 90 },
  { id: "12m", label: "Last 12 months", short: "12M", days: 365 },
];

export const segments = ["All platforms", "Web", "iOS", "Android"] as const;
export type Segment = (typeof segments)[number];

const share: Record<Segment, number> = {
  "All platforms": 1,
  Web: 0.56,
  iOS: 0.29,
  Android: 0.15,
};

export function noise(key: string, i: number) {
  let h = 2166136261;
  for (const c of `${key}:${i}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

const steps: Record<Range, { n: number; step: number }> = {
  "7d": { n: 7, step: 1 },
  "30d": { n: 30, step: 1 },
  "90d": { n: 13, step: 7 },
  "12m": { n: 12, step: 30.4 },
};

type TimeDef = {
  key: string;
  base: number;
  trend: number;
  vol: number;
  unit: Unit;
  additive?: boolean;
  weekly?: boolean;
};

export const metricDefs = {
  wau: {
    key: "wau",
    base: 23480,
    trend: 0.32,
    vol: 0.035,
    unit: "count",
  },
  mrr: { key: "mrr", base: 488900, trend: 0.38, vol: 0.008, unit: "money" },
  conversion: {
    key: "conversion",
    base: 12.1,
    trend: 0.05,
    vol: 0.06,
    unit: "pct",
  },
  churn: { key: "churn", base: 4.1, trend: -0.3, vol: 0.05, unit: "pct" },
  signups: {
    key: "signups",
    base: 410,
    trend: 0.3,
    vol: 0.12,
    unit: "count",
    additive: true,
    weekly: true,
  },
  sessions: {
    key: "sessions",
    base: 7.4,
    trend: 0.08,
    vol: 0.04,
    unit: "minutes",
  },
  errors: { key: "errors", base: 0.42, trend: -0.3, vol: 0.16, unit: "pct" },
} satisfies Record<string, TimeDef>;

export type MetricKey = keyof typeof metricDefs;

function dateAgo(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - Math.round(days));
  return d;
}

function valueAt(
  def: TimeDef,
  daysAgo: number,
  segment: Segment,
  step: number,
) {
  const scaled =
    def.unit === "count" || def.unit === "money"
      ? share[segment]
      : 1 + 0.12 * noise(`${def.key}-${segment}`, 0);
  const bucket = Math.round(daysAgo / step);
  const day = dateAgo(daysAgo).getDay();
  const weekend =
    def.weekly && step === 1 && (day === 0 || day === 6) ? 0.78 : 1;
  const value =
    def.base *
    scaled *
    weekend *
    (1 - (def.trend * daysAgo) / 365) *
    (1 + def.vol * noise(`${def.key}-${step}-${segment}`, bucket)) *
    (def.additive ? step : 1);
  return def.unit === "count" ? Math.round(value) : value;
}

export function series(
  key: MetricKey,
  range: Range,
  segment: Segment,
): Point[] {
  const def: TimeDef = metricDefs[key];
  const { n, step } = steps[range];
  return Array.from({ length: n }, (_, k) => {
    const daysAgo = (n - 1 - k) * step;
    const d = dateAgo(daysAgo);
    return {
      label:
        range === "12m"
          ? d.toLocaleDateString("en-US", { month: "short" })
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: valueAt(def, daysAgo, segment, step),
      previous: valueAt(def, daysAgo + n * step, segment, step),
    };
  });
}

export function summarize(key: MetricKey, points: Point[]) {
  const def: TimeDef = metricDefs[key];
  const pick = (get: (p: Point) => number) =>
    def.additive
      ? points.reduce((s, p) => s + get(p), 0)
      : def.unit !== "money"
        ? points.reduce((s, p) => s + get(p), 0) / points.length
        : get(points[points.length - 1]);
  return {
    value: pick((p) => p.value),
    previous: pick((p) => p.previous ?? p.value),
    unit: def.unit,
  };
}

export function formatValue(value: number, unit: Unit, compact = false) {
  if (unit === "pct") return `${value.toFixed(value < 1 ? 2 : 1)}%`;
  if (unit === "minutes") return `${value.toFixed(1)} min`;
  const options: Intl.NumberFormatOptions = compact
    ? { notation: "compact", maximumFractionDigits: 1 }
    : { maximumFractionDigits: 0 };
  if (unit === "money")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      ...options,
    }).format(value);
  return new Intl.NumberFormat("en-US", options).format(value);
}

export function formatChange(value: number, previous: number, unit: Unit) {
  if (unit === "pct") {
    const diff = value - previous;
    return {
      text: `${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(value < 1 ? 2 : 1)} pt`,
      up: diff >= 0,
    };
  }
  const pct = ((value - previous) / previous) * 100;
  return {
    text: `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`,
    up: pct >= 0,
  };
}

export type ReportKind =
  | "line"
  | "bars"
  | "categories"
  | "funnel"
  | "retention";

export type Report = {
  id: string;
  name: string;
  description: string;
  category: "Engagement" | "Growth" | "Revenue" | "Reliability";
  kind: ReportKind;
  metric?: MetricKey;
  owner: string;
  updatedDaysAgo: number;
};

export const reports: Report[] = [
  {
    id: "wau",
    name: "Weekly active users",
    description: "Unique users who opened the product in each period.",
    category: "Engagement",
    kind: "line",
    metric: "wau",
    owner: "Maya Chen",
    updatedDaysAgo: 0,
  },
  {
    id: "sessions",
    name: "Average session length",
    description: "Mean time between the first and last event in a session.",
    category: "Engagement",
    kind: "line",
    metric: "sessions",
    owner: "Jordan Ellis",
    updatedDaysAgo: 3,
  },
  {
    id: "adoption",
    name: "Feature adoption",
    description:
      "Share of active accounts that used each feature at least once.",
    category: "Engagement",
    kind: "categories",
    owner: "Maya Chen",
    updatedDaysAgo: 6,
  },
  {
    id: "funnel",
    name: "Signup funnel",
    description:
      "Visitors who reached each signup step in the selected period.",
    category: "Growth",
    kind: "funnel",
    owner: "Priyanka Rao",
    updatedDaysAgo: 1,
  },
  {
    id: "signups",
    name: "New signups",
    description: "Accounts created in each period, before email verification.",
    category: "Growth",
    kind: "bars",
    metric: "signups",
    owner: "Priyanka Rao",
    updatedDaysAgo: 2,
  },
  {
    id: "revenue",
    name: "Revenue by plan",
    description: "Monthly recurring revenue split by plan.",
    category: "Revenue",
    kind: "categories",
    owner: "Samir Haddad",
    updatedDaysAgo: 4,
  },
  {
    id: "churn",
    name: "Churn by cohort",
    description:
      "Share of accounts lost within 90 days, by signup month, with month-over-month retention.",
    category: "Revenue",
    kind: "retention",
    owner: "Samir Haddad",
    updatedDaysAgo: 9,
  },
  {
    id: "errors",
    name: "Client error rate",
    description: "Sessions with at least one uncaught client error.",
    category: "Reliability",
    kind: "line",
    metric: "errors",
    owner: "Lena Fischer",
    updatedDaysAgo: 12,
  },
];

const rangeFactor = (range: Range) =>
  1 +
  0.04 *
    noise(
      "range",
      ranges.findIndex((r) => r.id === range),
    );

export function categories(
  reportId: string,
  range: Range,
  segment: Segment,
): { points: Point[]; unit: Unit } {
  if (reportId === "revenue")
    return {
      unit: "money",
      points: [
        ["Starter", 38200],
        ["Growth", 96400],
        ["Scale", 142800],
        ["Enterprise", 211500],
      ].map(([label, base], i) => ({
        label: String(label),
        value: Math.round(
          Number(base) *
            share[segment] *
            rangeFactor(range) *
            (1 + 0.03 * noise(`rev-${segment}`, i)),
        ),
        previous: Math.round(
          Number(base) *
            share[segment] *
            0.95 *
            (1 + 0.04 * noise(`rev-prev-${range}`, i)),
        ),
      })),
    };
  return {
    unit: "pct",
    points: [
      ["Dashboards", 82],
      ["Funnels", 64],
      ["Alerts", 47],
      ["Exports", 39],
      ["Retention", 31],
      ["Segments", 26],
    ].map(([label, base], i) => ({
      label: String(label),
      value: Math.min(
        99,
        Number(base) * (1 + 0.08 * noise(`adopt-${segment}-${range}`, i)),
      ),
      previous: Number(base) * (0.93 + 0.05 * noise(`adopt-prev-${range}`, i)),
    })),
  };
}

export function funnel(range: Range, segment: Segment) {
  const days = ranges.find((r) => r.id === range)?.days ?? 30;
  const top = Math.round(
    52400 * (days / 30) * share[segment] * rangeFactor(range),
  );
  const steps: [string, number][] = [
    ["Visited pricing page", 1],
    ["Started signup", 0.283],
    ["Verified email", 0.616],
    ["Created first report", 0.695],
    ["Invited a teammate", 0.48],
  ];
  let count = top;
  return steps.map(([label, rate], i) => {
    count =
      i === 0
        ? top
        : Math.round(
            count * rate * (1 + 0.05 * noise(`funnel-${segment}-${range}`, i)),
          );
    return { label, value: count };
  });
}

export function cohorts(segment: Segment) {
  return Array.from({ length: 6 }, (_, row) => {
    const monthsAgo = 6 - row;
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - monthsAgo);
    const lift = row * 0.012;
    return {
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      size: Math.round(
        1840 *
          share[segment] *
          (1 + 0.15 * noise(`cohort-size-${segment}`, row)) *
          (1 + row * 0.06),
      ),
      churn: Math.max(
        2.5,
        6.8 - row * 0.55 + 0.3 * noise(`cohort-churn-${segment}`, row),
      ),
      retention: Array.from({ length: monthsAgo }, (_, m) =>
        m === 0
          ? 100
          : Math.min(
              99,
              100 *
                (Math.exp(-0.32 * m ** 0.7) + lift) *
                (1 + 0.025 * noise(`ret-${segment}-${row}`, m)),
            ),
      ),
    };
  });
}

export function topEvents(range: Range, segment: Segment) {
  const days = ranges.find((r) => r.id === range)?.days ?? 30;
  return [
    ["Viewed dashboard", 184200, 0.62],
    ["Created report", 23840, 0.31],
    ["Shared report", 9120, 0.18],
    ["Exported data", 7480, 0.15],
    ["Created alert", 3260, 0.09],
    ["Invited teammate", 2190, 0.07],
    ["Connected data source", 1140, 0.05],
  ].map(([name, base, reach], i) => {
    const count = Math.round(
      Number(base) *
        (days / 30) *
        share[segment] *
        (1 + 0.06 * noise(`ev-${range}-${segment}`, i)),
    );
    return {
      name: String(name),
      count,
      users: Math.round(
        23480 *
          Number(reach) *
          share[segment] *
          Math.min(1.6, (days / 30) ** 0.35),
      ),
      change: 12 * noise(`ev-change-${range}-${segment}`, i),
    };
  });
}

export const metrics = [
  "Weekly active users",
  "MRR",
  "Signup conversion",
  "Churn rate",
  "Error rate",
];

export type Alert = {
  id: string;
  name: string;
  metric: string;
  condition: "above" | "below";
  threshold: number;
  channel: "Email" | "Slack" | "PagerDuty";
  paused: boolean;
  lastTriggered: string | null;
};

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600000).toISOString();

export const seedAlerts: Alert[] = [
  {
    id: "a1",
    name: "Churn spike",
    metric: "Churn rate",
    condition: "above",
    threshold: 6,
    channel: "Slack",
    paused: false,
    lastTriggered: hoursAgo(3),
  },
  {
    id: "a2",
    name: "Signups dropped",
    metric: "Signup conversion",
    condition: "below",
    threshold: 10,
    channel: "Email",
    paused: false,
    lastTriggered: hoursAgo(52),
  },
  {
    id: "a3",
    name: "Error rate above budget",
    metric: "Error rate",
    condition: "above",
    threshold: 0.8,
    channel: "PagerDuty",
    paused: false,
    lastTriggered: hoursAgo(0.6),
  },
  {
    id: "a4",
    name: "Weekly actives below target",
    metric: "Weekly active users",
    condition: "below",
    threshold: 20000,
    channel: "Slack",
    paused: false,
    lastTriggered: hoursAgo(24 * 19),
  },
  {
    id: "a5",
    name: "MRR milestone reached",
    metric: "MRR",
    condition: "above",
    threshold: 500000,
    channel: "Email",
    paused: false,
    lastTriggered: null,
  },
  {
    id: "a6",
    name: "Conversion regression after release",
    metric: "Signup conversion",
    condition: "below",
    threshold: 11,
    channel: "Slack",
    paused: true,
    lastTriggered: hoursAgo(24 * 33),
  },
  {
    id: "a7",
    name: "Android error rate",
    metric: "Error rate",
    condition: "above",
    threshold: 1.2,
    channel: "PagerDuty",
    paused: false,
    lastTriggered: hoursAgo(24 * 6),
  },
  {
    id: "a8",
    name: "Holiday traffic dip",
    metric: "Weekly active users",
    condition: "below",
    threshold: 15000,
    channel: "Email",
    paused: true,
    lastTriggered: null,
  },
  { id: "a9", name: "iOS signup conversion", metric: "Signup conversion", condition: "below", threshold: 9.5, channel: "Slack", paused: false, lastTriggered: hoursAgo(24 * 11) },
  { id: "a10", name: "Enterprise MRR contraction", metric: "MRR", condition: "below", threshold: 470000, channel: "Email", paused: false, lastTriggered: null },
  { id: "a11", name: "Checkout errors on web", metric: "Error rate", condition: "above", threshold: 0.6, channel: "PagerDuty", paused: false, lastTriggered: hoursAgo(9) },
  { id: "a12", name: "Churn above board target for the quarter", metric: "Churn rate", condition: "above", threshold: 5, channel: "Email", paused: false, lastTriggered: hoursAgo(24 * 47) },
  { id: "a13", name: "Weekend activity floor", metric: "Weekly active users", condition: "below", threshold: 18000, channel: "Slack", paused: true, lastTriggered: hoursAgo(24 * 70) },
  { id: "a14", name: "Trial conversion lift", metric: "Signup conversion", condition: "above", threshold: 14, channel: "Slack", paused: false, lastTriggered: null },
];

export type ExportRow = {
  id: string;
  report: string;
  format: string;
  range: string;
  by: string;
  createdAt: string;
  size: string;
  status: "Ready" | "Expired";
};

export const seedExports: ExportRow[] = [
  {
    id: "e1",
    report: "Revenue by plan",
    format: "XLSX",
    range: "Last 30 days",
    by: "Samir Haddad",
    createdAt: hoursAgo(2),
    size: "84 KB",
    status: "Ready",
  },
  {
    id: "e2",
    report: "Weekly active users",
    format: "CSV",
    range: "Last 90 days",
    by: "Jordan Ellis",
    createdAt: hoursAgo(20),
    size: "12 KB",
    status: "Ready",
  },
  {
    id: "e3",
    report: "Signup funnel",
    format: "PDF",
    range: "Last 30 days",
    by: "Priyanka Rao",
    createdAt: hoursAgo(28),
    size: "1.2 MB",
    status: "Ready",
  },
  {
    id: "e4",
    report: "Churn by cohort",
    format: "CSV",
    range: "Last 12 months",
    by: "Samir Haddad",
    createdAt: hoursAgo(24 * 3),
    size: "31 KB",
    status: "Ready",
  },
  {
    id: "e5",
    report: "Feature adoption",
    format: "PDF",
    range: "Last 90 days",
    by: "Maya Chen",
    createdAt: hoursAgo(24 * 5),
    size: "940 KB",
    status: "Ready",
  },
  {
    id: "e6",
    report: "Client error rate",
    format: "CSV",
    range: "Last 7 days",
    by: "Lena Fischer",
    createdAt: hoursAgo(24 * 9),
    size: "6 KB",
    status: "Expired",
  },
  {
    id: "e7",
    report: "Weekly active users",
    format: "XLSX",
    range: "Last 12 months",
    by: "Maya Chen",
    createdAt: hoursAgo(24 * 16),
    size: "58 KB",
    status: "Expired",
  },
  {
    id: "e8",
    report: "Revenue by plan",
    format: "PDF",
    range: "Last 90 days",
    by: "Jordan Ellis",
    createdAt: hoursAgo(24 * 24),
    size: "1.6 MB",
    status: "Expired",
  },
  ...[
    ["Signup funnel", "CSV", "Last 7 days", "Priyanka Rao", "9 KB"],
    ["New signups", "XLSX", "Last 30 days", "Priyanka Rao", "22 KB"],
    ["Average session length", "PDF", "Last 90 days", "Jordan Ellis", "870 KB"],
    ["Churn by cohort", "PDF", "Last 12 months", "Samir Haddad", "1.4 MB"],
    ["Weekly active users", "CSV", "Last 30 days", "Maya Chen", "11 KB"],
    ["Revenue by plan", "CSV", "Last 12 months", "Samir Haddad", "37 KB"],
    ["Feature adoption", "XLSX", "Last 30 days", "Maya Chen", "19 KB"],
    ["Client error rate", "PDF", "Last 30 days", "Lena Fischer", "760 KB"],
    ["Signup funnel", "XLSX", "Last 90 days", "Priyanka Rao", "28 KB"],
    ["New signups", "CSV", "Last 12 months", "Jordan Ellis", "41 KB"],
    ["Weekly active users", "PDF", "Last 7 days", "Maya Chen", "690 KB"],
    ["Revenue by plan", "XLSX", "Last 30 days", "Samir Haddad", "80 KB"],
  ].map(
    ([report, format, range, by, size], i): ExportRow => ({
      id: `e${i + 9}`,
      report,
      format,
      range,
      by,
      createdAt: hoursAgo(24 * (30 + i * 4)),
      size,
      status: "Expired",
    }),
  ),
];

export const notifications = [
  {
    id: "n1",
    title: "Error rate above budget triggered on PagerDuty",
    time: hoursAgo(0.6),
    unread: true,
  },
  {
    id: "n2",
    title: "Your export of Revenue by plan is ready",
    time: hoursAgo(2),
    unread: true,
  },
  {
    id: "n3",
    title: "Churn spike triggered in #growth-alerts",
    time: hoursAgo(3),
    unread: true,
  },
  {
    id: "n4",
    title: "Maya Chen shared Weekly active users with you",
    time: hoursAgo(26),
    unread: false,
  },
  {
    id: "n5",
    title: "Your latest invoice is available",
    time: hoursAgo(24 * 4),
    unread: false,
  },
];

export const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    detail: "3 seats, 10 reports, 1M events",
  },
  {
    id: "growth",
    name: "Growth",
    price: 199,
    detail: "15 seats, unlimited reports, 5M events",
  },
  {
    id: "scale",
    name: "Scale",
    price: 599,
    detail: "Unlimited seats, SSO, alerts API, 25M events",
  },
];

export const invoices = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - i);
  return {
    id: `INV-${d.getFullYear()}-${String(118 - i).padStart(4, "0")}`,
    date: d.toLocaleDateString("en-CA"),
    amount: i === 5 ? 49 : 199,
    status: "Paid" as const,
  };
});
