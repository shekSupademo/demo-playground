import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Download,
  FileBarChart,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Badge,
  EmptyState,
  formatDate,
  MobileNav,
  money,
  NotificationsMenu,
  relativeTime,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import { Chart, Funnel, Retention } from "./charts";
import {
  type Alert,
  categories,
  cohorts,
  type ExportRow,
  formatChange,
  formatValue,
  funnel,
  invoices,
  type MetricKey,
  metrics,
  notifications,
  plans,
  type Range,
  type Report,
  ranges,
  reports,
  type Segment,
  seedAlerts,
  seedExports,
  segments,
  series,
  summarize,
  topEvents,
  type Unit,
} from "./data";

type Profile = { name: string; email: string; timezone: string };
type Filters = {
  range: Range;
  setRange: (r: Range) => void;
  segment: Segment;
  setSegment: (s: Segment) => void;
};

const font = {
  fontFamily: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
};
const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2";
const input =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-500/15 aria-invalid:border-red-500";
const primary = cx(
  "inline-flex items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50",
  focus,
);
const secondary = cx(
  "inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50",
  focus,
);
const iconButton = cx(
  "grid size-9 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900",
  focus,
);
const textLink = cx(
  "rounded text-sm font-medium text-violet-700 hover:underline",
  focus,
);
const panel = "rounded-xl border border-zinc-200 bg-white shadow-xs";
const muted = "text-zinc-500";
const th = "px-4 py-2.5 font-medium";
const footer =
  "flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-zinc-100 bg-zinc-50/70 px-5 py-3 sm:px-6";

function Logo() {
  return (
    <div className="flex items-center gap-2" data-testid="logo">
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#7C3AED" />
        <path
          d="M7 21.5l5.5-6 4.5 3.5 8-9"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="10" r="2.4" fill="#C4B5FD" />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight">Metricly</span>
    </div>
  );
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className={cx("mt-1 text-sm", muted)}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function FilterBar({ range, setRange, segment, setSegment }: Filters) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 shadow-xs"
      >
        {ranges.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={range === r.id}
            aria-label={r.label}
            title={r.label}
            onClick={() => setRange(r.id)}
            className={cx(
              "rounded px-2.5 py-1 text-sm font-medium tabular-nums transition",
              focus,
              range === r.id
                ? "bg-violet-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100",
            )}
            data-testid={`range-${r.id}`}
          >
            {r.short}
          </button>
        ))}
      </div>
      <label>
        <span className="sr-only">Segment</span>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as Segment)}
          className={cx(input, "w-auto py-1.5")}
          data-testid="segment-filter"
        >
          {segments.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Change({
  value,
  previous,
  unit,
  inverse = false,
}: {
  value: number;
  previous: number;
  unit: Unit;
  inverse?: boolean;
}) {
  const change = formatChange(value, previous, unit);
  const good = inverse ? !change.up : change.up;
  const Icon = change.up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        good ? "text-emerald-700" : "text-rose-700",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {change.text}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const d = values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (values.length - 1)) * 96 + 2).toFixed(1)},${(26 - ((v - min) / (max - min || 1)) * 22).toFixed(1)}`,
    )
    .join("");
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24 shrink-0" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="#7C3AED"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const kpiDefs: {
  testId: string;
  label: string;
  metric: MetricKey;
  inverse?: boolean;
}[] = [
  { testId: "kpi-active-users", label: "Active users", metric: "wau" },
  { testId: "kpi-mrr", label: "MRR", metric: "mrr" },
  { testId: "kpi-conversion", label: "Conversion", metric: "conversion" },
  { testId: "kpi-churn", label: "Churn", metric: "churn", inverse: true },
];

function Dashboard({
  title,
  reportsPath,
  filters,
}: {
  title: string;
  reportsPath: string;
  filters: Filters;
}) {
  useDocumentTitle(`${title} – Metricly`);
  const { range, segment } = filters;
  const rangeLabel = ranges.find((r) => r.id === range)?.label ?? "";
  const wau = series("wau", range, segment);
  const signups = series("signups", range, segment);
  const events = topEvents(range, segment);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={title}
        description={`${rangeLabel} on ${segment === "All platforms" ? "all platforms" : segment}, compared with the period before`}
        action={<FilterBar {...filters} />}
      />
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        {kpiDefs.map((k) => {
          const points = series(k.metric, range, segment);
          const s = summarize(k.metric, points);
          return (
            <div
              key={k.testId}
              className="flex items-end justify-between gap-3 bg-white p-5"
              data-testid={k.testId}
            >
              <div className="min-w-0">
                <dt className={cx("text-sm", muted)}>{k.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                  {formatValue(s.value, s.unit)}
                </dd>
                <dd className="mt-1 flex flex-wrap items-center gap-1">
                  <Change
                    value={s.value}
                    previous={s.previous}
                    unit={s.unit}
                    inverse={k.inverse}
                  />
                  <span className="text-xs text-zinc-400">
                    vs previous period
                  </span>
                </dd>
              </div>
              <Sparkline values={points.map((p) => p.value)} />
            </div>
          );
        })}
      </dl>

      <section className={cx(panel, "p-5 sm:p-6")} aria-labelledby="dash-wau">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="dash-wau" className="font-semibold">
              Weekly active users
            </h2>
            <p className={cx("text-sm", muted)}>
              Unique users who opened the product in each period.
            </p>
          </div>
          <Link
            to={`${reportsPath}?report=wau`}
            className={textLink}
            data-testid="view-reports"
          >
            View all reports
          </Link>
        </div>
        <Chart
          kind="line"
          points={wau}
          unit="count"
          label="Weekly active users"
          testId="chart-wau"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section
          className={cx(panel, "min-w-0 p-5 sm:p-6")}
          aria-labelledby="dash-signups"
        >
          <h2 id="dash-signups" className="font-semibold">
            New signups
          </h2>
          <p className={cx("mb-4 text-sm", muted)}>
            {formatValue(summarize("signups", signups).value, "count")} accounts
            created
          </p>
          <Chart
            kind="bar"
            points={signups}
            unit="count"
            label="New signups"
            testId="chart-signups"
            compare={false}
          />
        </section>
        <section
          className={cx(panel, "min-w-0 overflow-hidden")}
          aria-labelledby="dash-events"
        >
          <h2 id="dash-events" className="px-5 pt-5 font-semibold sm:px-6">
            Top events
          </h2>
          <p className={cx("mb-3 px-5 text-sm sm:px-6", muted)}>
            Most frequent tracked events
          </p>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="border-y border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th scope="col" className={cx(th, "text-left sm:pl-6")}>
                    Event
                  </th>
                  <th scope="col" className={cx(th, "text-right")}>
                    Count
                  </th>
                  <th scope="col" className={cx(th, "text-right")}>
                    Users
                  </th>
                  <th scope="col" className={cx(th, "text-right sm:pr-6")}>
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {events.map((e) => (
                  <tr key={e.name} className="hover:bg-zinc-50">
                    <th
                      scope="row"
                      className="px-4 py-2.5 text-left font-medium sm:pl-6"
                    >
                      {e.name}
                    </th>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {e.count.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600">
                      {e.users.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-2.5 text-right sm:pr-6">
                      <Change
                        value={100 + e.change}
                        previous={100}
                        unit="count"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportBody({ report, filters }: { report: Report; filters: Filters }) {
  const { range, segment } = filters;
  if (report.kind === "funnel")
    return (
      <Funnel steps={funnel(range, segment)} testId={`chart-${report.id}`} />
    );
  if (report.kind === "retention") {
    const rows = cohorts(segment);
    return (
      <div className="flex flex-col gap-8">
        <Chart
          kind="bar"
          points={rows.map((r) => ({
            label: r.label.split(" ")[0],
            value: r.churn,
          }))}
          unit="pct"
          label="90-day churn by signup month"
          testId={`chart-${report.id}`}
          compare={false}
        />
        <div>
          <h3 className="mb-2 text-sm font-semibold">Retention by cohort</h3>
          <Retention rows={rows} />
        </div>
      </div>
    );
  }
  if (report.kind === "categories") {
    const data = categories(report.id, range, segment);
    return (
      <Chart
        kind="bar"
        points={data.points}
        unit={data.unit}
        label={report.name}
        testId={`chart-${report.id}`}
      />
    );
  }
  const metric = report.metric ?? "wau";
  const points = series(metric, range, segment);
  const unit = summarize(metric, points).unit;
  const breakdown = segments.slice(1).map((s) => ({
    segment: s,
    ...summarize(metric, series(metric, range, s)),
  }));
  const total = breakdown.reduce((sum, b) => sum + b.value, 0);
  return (
    <div className="flex flex-col gap-8">
      <Chart
        kind={report.kind === "bars" ? "bar" : "line"}
        points={points}
        unit={unit}
        label={report.name}
        testId={`chart-${report.id}`}
        compare={report.kind === "line"}
      />
      <div className="relative overflow-x-auto">
        <table
          className="w-full min-w-[26rem] text-sm"
          data-testid="breakdown-table"
        >
          <caption className="mb-2 text-left text-sm font-semibold">
            Breakdown by platform
          </caption>
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <th scope="col" className="py-2 pr-4 text-left font-medium">
                Platform
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                Value
              </th>
              {unit === "count" && (
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Share
                </th>
              )}
              <th scope="col" className="py-2 pl-4 text-right font-medium">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {breakdown.map((b) => (
              <tr key={b.segment}>
                <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                  {b.segment}
                </th>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatValue(b.value, b.unit)}
                </td>
                {unit === "count" && (
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600">
                    {((b.value / total) * 100).toFixed(0)}%
                  </td>
                )}
                <td className="py-2.5 pl-4 text-right">
                  <Change
                    value={b.value}
                    previous={b.previous}
                    unit={b.unit}
                    inverse={metric === "errors"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Headline = {
  label: string;
  value: string;
  change: {
    value: number;
    previous: number;
    unit: Unit;
    inverse?: boolean;
  } | null;
};

function headline(report: Report, filters: Filters): Headline {
  const { range, segment } = filters;
  if (report.kind === "funnel")
    return {
      label: "Visitors",
      value: funnel(range, segment)[0].value.toLocaleString("en-US"),
      change: null,
    };
  if (report.kind === "retention") {
    const rows = cohorts(segment);
    return {
      label: "Average 90-day churn",
      value: formatValue(
        rows.reduce((s, r) => s + r.churn, 0) / rows.length,
        "pct",
      ),
      change: null,
    };
  }
  if (report.kind === "categories") {
    const data = categories(report.id, range, segment);
    const n = data.unit === "money" ? 1 : data.points.length;
    const value = data.points.reduce((s, p) => s + p.value, 0) / n;
    const previous =
      data.points.reduce((s, p) => s + (p.previous ?? p.value), 0) / n;
    return {
      label: data.unit === "money" ? "Total MRR" : "Average adoption",
      value: formatValue(value, data.unit),
      change: { value, previous, unit: data.unit },
    };
  }
  const metric = report.metric ?? "wau";
  const s = summarize(metric, series(metric, range, segment));
  return {
    label:
      metric === "signups" ? "Total" : "Average",
    value: formatValue(s.value, s.unit),
    change: {
      value: s.value,
      previous: s.previous,
      unit: s.unit,
      inverse: metric === "errors",
    },
  };
}

function ExportSection({
  initial,
  toast,
  headingLevel,
  range,
  exports,
  onExport,
}: {
  initial: string;
  toast: (m: string) => void;
  headingLevel: "h1" | "h2";
  range: Range;
  exports: ExportRow[];
  onExport: (row: ExportRow) => void;
}) {
  const [reportId, setReportId] = useState(initial);
  const [fileType, setFileType] = useState("CSV");
  const [exportRange, setExportRange] = useState<Range>(range);
  const [breakdown, setBreakdown] = useState(true);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(10);
  const Heading = headingLevel;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const report = reports.find((r) => r.id === reportId) ?? reports[0];
    setBusy(true);
    setTimeout(() => {
      onExport({
        id: `e${Date.now()}`,
        report: report.name,
        format: fileType,
        range: ranges.find((r) => r.id === exportRange)?.label ?? "",
        by: "Jordan Ellis",
        createdAt: new Date().toISOString(),
        size: fileType === "PDF" ? "1.1 MB" : breakdown ? "42 KB" : "18 KB",
        status: "Ready",
      });
      toast(`${report.name} exported as ${fileType}`);
      setBusy(false);
    }, 600);
  };
  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-5">
      <div>
        <Heading
          id="export-heading"
          className={
            headingLevel === "h1"
              ? "text-2xl font-semibold tracking-tight"
              : "text-lg font-semibold"
          }
        >
          {headingLevel === "h1" ? "Exports" : "Export"}
        </Heading>
        <p className={cx("mt-1 text-sm", muted)}>
          Download a report for the date range you choose. Files stay available
          for 7 days.
        </p>
      </div>
      <form onSubmit={submit} className={cx(panel, "flex flex-col")}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.4fr_1fr_auto] lg:items-end">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            Report
            <select
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className={input}
              data-testid="export-report-select"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            Date range
            <select
              value={exportRange}
              onChange={(e) => setExportRange(e.target.value as Range)}
              className={input}
              data-testid="export-range"
            >
              {ranges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="text-sm">
            <legend className="mb-1.5 font-medium">Format</legend>
            <div className="inline-flex w-fit rounded-md border border-zinc-200 bg-white p-0.5">
              {["CSV", "PDF", "XLSX"].map((f) => (
                <label
                  key={f}
                  className="relative cursor-pointer rounded px-3 py-1 text-zinc-600 has-checked:bg-violet-600 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-violet-500"
                >
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={fileType === f}
                    onChange={() => setFileType(f)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    data-testid={`export-format-${f.toLowerCase()}`}
                  />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className={cx(footer, "justify-between")}>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={breakdown}
              onChange={() => setBreakdown(!breakdown)}
              className="size-4 accent-violet-600"
            />
            Include platform breakdown
          </label>
          <button
            type="submit"
            className={primary}
            disabled={busy}
            data-testid="export-report"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {busy ? "Exporting…" : "Export report"}
          </button>
        </div>
      </form>
      <div className={cx(panel, "overflow-hidden")}>
        <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3 sm:px-6">
          <h3 className="text-sm font-semibold">Recent exports</h3>
          <p className="text-xs tabular-nums text-zinc-500" data-testid="export-count">
            Showing 1–{Math.min(visible, exports.length)} of {exports.length}
          </p>
        </div>
        <div className="relative overflow-x-auto">
          <table
            className="w-full min-w-[46rem] text-sm"
            data-testid="export-history"
          >
            <thead className="border-y border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th scope="col" className={cx(th, "text-left sm:pl-6")}>
                  File
                </th>
                <th scope="col" className={cx(th, "text-left")}>
                  Date range
                </th>
                <th scope="col" className={cx(th, "text-left")}>
                  Created by
                </th>
                <th scope="col" className={cx(th, "text-left")}>
                  Created
                </th>
                <th scope="col" className={cx(th, "text-right")}>
                  Size
                </th>
                <th scope="col" className={cx(th, "sm:pr-6")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {exports.slice(0, visible).map((x) => (
                <tr key={x.id} className="hover:bg-zinc-50">
                  <th
                    scope="row"
                    className="max-w-72 px-4 py-2.5 text-left font-medium sm:pl-6"
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                        {x.format}
                      </span>
                      <span className="truncate" title={x.report}>
                        {x.report}
                      </span>
                    </span>
                  </th>
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                    {x.range}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                    {x.by}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                    {relativeTime(x.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600">
                    {x.size}
                  </td>
                  <td className="px-4 py-2.5 text-right sm:pr-6">
                    {x.status === "Ready" ? (
                      <button
                        type="button"
                        className={textLink}
                        onClick={() =>
                          toast(`Download started for ${x.report}`)
                        }
                      >
                        Download
                      </button>
                    ) : (
                      <Badge>Expired</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible < exports.length && (
          <div className="border-t border-zinc-100 px-5 py-3 text-center sm:px-6">
            <button
              type="button"
              className={textLink}
              onClick={() => setVisible(visible + 10)}
            >
              Load more exports
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ReportsPage({
  title,
  withExport,
  toast,
  filters,
  exports,
  onExport,
}: {
  title: string;
  withExport: boolean;
  toast: (m: string) => void;
  filters: Filters;
  exports: ExportRow[];
  onExport: (row: ExportRow) => void;
}) {
  useDocumentTitle(`${title} – Metricly`);
  const [params, setParams] = useSearchParams();
  const initial = params.get("report");
  const query = params.get("q") ?? "";
  const [selected, setSelected] = useState(initial ?? reports[0].id);
  const report = reports.find((r) => r.id === selected) ?? reports[0];
  const listed = reports.filter((r) =>
    `${r.name} ${r.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const groups = [...new Set(listed.map((r) => r.category))];
  const head = headline(report, filters);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={title}
        description={
          withExport
            ? "Explore saved reports and export them in one place."
            : "Saved reports for the Northwind workspace."
        }
        action={<FilterBar {...filters} />}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-4">
          <label className="relative block">
            <span className="sr-only">Filter reports</span>
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-4 text-zinc-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set("q", e.target.value);
                else next.delete("q");
                setParams(next, { replace: true });
              }}
              placeholder="Filter reports"
              className={cx(input, "pl-9")}
              data-testid="report-search"
            />
          </label>
          {listed.length === 0 ? (
            <p className={cx("px-1 text-sm", muted)}>
              No reports match “{query}”.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((g) => (
                <div key={g}>
                  <h2 className="px-3 text-xs font-medium text-zinc-400">
                    {g}
                  </h2>
                  <ul aria-label={g} className="mt-1 flex flex-col gap-0.5">
                    {listed
                      .filter((r) => r.category === g)
                      .map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            aria-pressed={r.id === report.id}
                            onClick={() => setSelected(r.id)}
                            className={cx(
                              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition",
                              focus,
                              r.id === report.id
                                ? "bg-violet-50 font-medium text-violet-800"
                                : "text-zinc-700 hover:bg-zinc-100",
                            )}
                            data-testid={`report-${r.id}`}
                          >
                            <FileBarChart
                              className={cx(
                                "size-4 shrink-0",
                                r.id === report.id
                                  ? "text-violet-600"
                                  : "text-zinc-400",
                              )}
                              aria-hidden
                            />
                            <span className="truncate" title={r.name}>
                              {r.name}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <section
          className={cx(panel, "min-w-0 p-5 sm:p-6")}
          aria-labelledby="report-title"
          data-testid="report-detail"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="report-title" className="text-lg font-semibold">
                {report.name}
              </h2>
              <p className={cx("mt-0.5 text-sm", muted)}>
                {report.description}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Owned by {report.owner}, updated{" "}
                {report.updatedDaysAgo === 0
                  ? "today"
                  : report.updatedDaysAgo === 1
                    ? "yesterday"
                    : `${report.updatedDaysAgo} days ago`}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-zinc-500">{head.label}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {head.value}
              </p>
              {head.change && (
                <Change
                  value={head.change.value}
                  previous={head.change.previous}
                  unit={head.change.unit}
                  inverse={head.change.inverse}
                />
              )}
            </div>
          </div>
          <div className="mt-6">
            <ReportBody report={report} filters={filters} />
          </div>
        </section>
      </div>
      {withExport && (
        <ExportSection
          key={report.id}
          initial={report.id}
          toast={toast}
          headingLevel="h2"
          range={filters.range}
          exports={exports}
          onExport={onExport}
        />
      )}
    </div>
  );
}

function ExportsPage({
  toast,
  range,
  exports,
  onExport,
}: {
  toast: (m: string) => void;
  range: Range;
  exports: ExportRow[];
  onExport: (row: ExportRow) => void;
}) {
  useDocumentTitle("Exports – Metricly");
  return (
    <ExportSection
      initial={reports[0].id}
      toast={toast}
      headingLevel="h1"
      range={range}
      exports={exports}
      onExport={onExport}
    />
  );
}

const channels = ["Email", "Slack", "PagerDuty"] as const;
const isTriggered = (a: Alert) =>
  !a.paused &&
  a.lastTriggered !== null &&
  Date.now() - new Date(a.lastTriggered).getTime() < 86400000;
const alertStatus = (a: Alert) =>
  a.paused ? "Paused" : isTriggered(a) ? "Triggered" : "Active";

function AlertsPage({
  alerts,
  onCreate,
  onUpdate,
  onDelete,
}: {
  alerts: Alert[];
  onCreate: (a: Omit<Alert, "id" | "paused" | "lastTriggered">) => void;
  onUpdate: (id: string, patch: Partial<Alert>) => void;
  onDelete: (id: string) => void;
}) {
  useDocumentTitle("Alerts – Metricly");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<
    "All" | "Triggered" | "Active" | "Paused"
  >("All");
  const [errors, setErrors] = useState<{ name?: string; threshold?: string }>(
    {},
  );
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = alerts.filter(
    (a) =>
      (filter === "All" || alertStatus(a) === filter) &&
      `${a.name} ${a.metric} ${a.channel}`.toLowerCase().includes(q),
  );
  const openDialog = () => {
    setErrors({});
    setOpen(true);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const threshold = String(data.get("threshold") ?? "").trim();
    const next: typeof errors = {};
    if (!name) next.name = "Name is required";
    if (!threshold) next.threshold = "Threshold is required";
    else if (Number.isNaN(Number(threshold))) next.threshold = "Enter a number";
    setErrors(next);
    if (next.name || next.threshold) {
      form
        .querySelector<HTMLElement>(
          next.name ? "[name=name]" : "[name=threshold]",
        )
        ?.focus();
      return;
    }
    onCreate({
      name,
      metric: String(data.get("metric")),
      condition: data.get("condition") === "below" ? "below" : "above",
      threshold: Number(threshold),
      channel: channels.find((c) => c === data.get("channel")) ?? "Email",
    });
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alerts"
        description="Get notified when a metric crosses a threshold. Checked every 5 minutes."
        action={
          <button
            type="button"
            className={primary}
            onClick={openDialog}
            data-testid="new-alert"
          >
            <Plus className="size-4" aria-hidden /> New alert
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
      <label className="relative block w-full sm:max-w-xs">
        <span className="sr-only">Search alerts</span>
        <Search
          className="pointer-events-none absolute top-2.5 left-3 size-4 text-zinc-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search alerts"
          className={cx(input, "pl-9")}
          data-testid="alert-search"
        />
      </label>
      <div
        role="group"
        aria-label="Filter alerts"
        className="inline-flex w-fit max-w-full overflow-x-auto rounded-md bg-zinc-100 p-0.5"
      >
        {(["All", "Triggered", "Active", "Paused"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cx(
              "shrink-0 rounded px-3 py-1 text-sm font-medium transition",
              focus,
              filter === f
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {f}
            <span className="ml-1.5 tabular-nums text-zinc-400">
              {f === "All"
                ? alerts.length
                : alerts.filter((a) => alertStatus(a) === f).length}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm tabular-nums text-zinc-500 sm:ml-auto" data-testid="alert-count">
        Showing {shown.length} of {alerts.length} alerts
      </p>
      </div>
      <div className={cx(panel, "overflow-hidden")}>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th scope="col" className={cx(th, "text-left sm:pl-6")}>
                  Alert
                </th>
                <th scope="col" className={cx(th, "text-left")}>
                  Notify
                </th>
                <th scope="col" className={cx(th, "text-left")}>
                  Status
                </th>
                <th scope="col" className={cx(th, "text-left")}>
                  Last triggered
                </th>
                <th scope="col" className={cx(th, "sm:pr-6")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y divide-zinc-100"
              data-testid="alert-list"
            >
              {shown.map((a) => {
                const status = alertStatus(a);
                return (
                  <tr key={a.id} className="hover:bg-zinc-50">
                    <th
                      scope="row"
                      className="max-w-80 px-4 py-3 text-left font-normal sm:pl-6"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cx(
                            "grid size-8 shrink-0 place-items-center rounded-md",
                            status === "Triggered"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-violet-50 text-violet-600",
                          )}
                        >
                          <Bell className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block truncate font-medium"
                            title={a.name}
                          >
                            {a.name}
                          </span>
                          <span className="block truncate text-zinc-500">
                            {a.metric}{" "}
                            {a.condition === "above"
                              ? "goes above"
                              : "drops below"}{" "}
                            <span className="tabular-nums">
                              {a.threshold.toLocaleString("en-US")}
                            </span>
                          </span>
                        </span>
                      </span>
                    </th>
                    <td className="px-4 py-3 text-zinc-600">{a.channel}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          status === "Triggered"
                            ? "danger"
                            : status === "Paused"
                              ? "neutral"
                              : "success"
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                      {a.lastTriggered ? (
                        relativeTime(a.lastTriggered)
                      ) : (
                        <span className="text-zinc-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right sm:pr-6">
                      <Menu
                        label={`Actions for ${a.name}`}
                        triggerClassName={cx(iconButton, "ml-auto size-8")}
                        trigger={
                          <MoreHorizontal className="size-4" aria-hidden />
                        }
                        items={[
                          {
                            label: a.paused ? "Resume alert" : "Pause alert",
                            onSelect: () =>
                              onUpdate(a.id, { paused: !a.paused }),
                          },
                          {
                            label: "Delete alert",
                            danger: true,
                            onSelect: () => onDelete(a.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <EmptyState
            icon={<Bell className="size-5" aria-hidden />}
            title={
              q
                ? "No alerts match your search"
                : filter === "All"
                  ? "No alerts yet"
                  : `No ${filter.toLowerCase()} alerts`
            }
            body="Alerts watch a metric and tell your team when it crosses a line."
            action={
              <button type="button" className={primary} onClick={openDialog}>
                <Plus className="size-4" aria-hidden /> New alert
              </button>
            }
          />
        )}
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New alert"
        testId="alert-dialog"
        className="w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 text-zinc-900 shadow-xl"
      >
        <form noValidate onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Name
            <input
              name="name"
              required
              placeholder="Churn above target"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "alert-name-error" : undefined}
              className={input}
              data-testid="alert-name"
            />
            {errors.name && (
              <span
                id="alert-name-error"
                className="text-xs font-medium text-red-600"
              >
                {errors.name}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Metric
            <select name="metric" className={input} data-testid="alert-metric">
              {metrics.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Condition
              <select
                name="condition"
                className={input}
                data-testid="alert-condition"
              >
                <option value="above">Goes above</option>
                <option value="below">Drops below</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Threshold
              <input
                name="threshold"
                type="number"
                step="any"
                required
                aria-invalid={errors.threshold ? true : undefined}
                aria-describedby={
                  errors.threshold ? "alert-threshold-error" : undefined
                }
                className={input}
                data-testid="alert-threshold"
              />
              {errors.threshold && (
                <span
                  id="alert-threshold-error"
                  className="text-xs font-medium text-red-600"
                >
                  {errors.threshold}
                </span>
              )}
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Notify
            <select
              name="channel"
              className={input}
              data-testid="alert-channel"
            >
              {channels.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={secondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primary}
              data-testid="create-alert"
            >
              Create alert
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b border-zinc-200 pb-8 last:border-b-0 last:pb-0 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className={cx("mt-1 text-sm", muted)}>{body}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileForm({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);
  const [digest, setDigest] = useState(true);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!draft.name.trim()) next.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
      next.email = "Enter a valid email address";
    setErrors(next);
    if (next.name || next.email) return;
    setBusy(true);
    setTimeout(() => {
      onSave(draft);
      setBusy(false);
    }, 500);
  };
  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Personal details"
        body="Shown to teammates on shared reports and alerts."
      >
        <form
          noValidate
          className={cx(panel, "flex flex-col")}
          onSubmit={submit}
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Full name
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={
                  errors.name ? "profile-name-error" : undefined
                }
                className={input}
                data-testid="profile-name"
              />
              {errors.name && (
                <span
                  id="profile-name-error"
                  className="text-xs font-medium text-red-600"
                >
                  {errors.name}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                required
                autoComplete="email"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={
                  errors.email ? "profile-email-error" : undefined
                }
                className={input}
                data-testid="profile-email"
              />
              {errors.email && (
                <span
                  id="profile-email-error"
                  className="text-xs font-medium text-red-600"
                >
                  {errors.email}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2 sm:max-w-xs">
              Time zone
              <select
                value={draft.timezone}
                onChange={(e) =>
                  setDraft({ ...draft, timezone: e.target.value })
                }
                className={input}
                data-testid="profile-timezone"
              >
                {[
                  "America/New_York",
                  "America/Los_Angeles",
                  "Europe/London",
                  "Europe/Berlin",
                  "Asia/Singapore",
                ].map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={digest}
                onChange={() => setDigest(!digest)}
                className="mt-0.5 size-4 accent-violet-600"
              />
              <span>
                <span className="block font-medium">Weekly email digest</span>
                <span className={muted}>
                  A Monday summary of the reports you follow.
                </span>
              </span>
            </label>
          </div>
          <div className={footer}>
            <button
              type="submit"
              className={primary}
              disabled={busy}
              data-testid="save-profile"
            >
              {busy && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              {busy ? "Saving profile…" : "Save profile"}
            </button>
          </div>
        </form>
      </Section>
      <Section
        title="Sessions"
        body="Devices that are signed in to your account."
      >
        <ul className={cx(panel, "divide-y divide-zinc-100 text-sm")}>
          {(
            [
              ["Chrome on macOS", "New York, this device", true],
              ["Safari on iPhone", "New York, 2 days ago", false],
              ["Firefox on Windows", "Boston, 3 weeks ago", false],
            ] as const
          ).map(([device, where, current]) => (
            <li
              key={device}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <span>
                <span className="block font-medium">{device}</span>
                <span className={muted}>{where}</span>
              </span>
              {current ? (
                <Badge tone="success">Current</Badge>
              ) : (
                <Badge>Signed in</Badge>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function BillingForm({
  plan,
  onChange,
  toast,
}: {
  plan: string;
  onChange: (plan: string) => void;
  toast: (m: string) => void;
}) {
  const [choice, setChoice] = useState(plan);
  const current = plans.find((p) => p.id === plan) ?? plans[1];
  const usage = [
    {
      label: "Seats",
      used: 9,
      limit: plan === "scale" ? 0 : plan === "starter" ? 3 : 15,
      suffix: "",
    },
    {
      label: "Events this month",
      used: 3.2,
      limit: plan === "scale" ? 25 : plan === "starter" ? 1 : 5,
      suffix: "M",
    },
  ];
  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Plan"
        body={`You're on ${current.name}, billed monthly. Changes apply right away and are prorated.`}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onChange(choice);
          }}
        >
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Plan</legend>
            {plans.map((p) => (
              <label
                key={p.id}
                className={cx(
                  panel,
                  "flex cursor-pointer flex-col gap-1 p-4 transition hover:border-zinc-300 has-checked:border-violet-500 has-checked:ring-2 has-checked:ring-violet-500/20 has-focus-visible:ring-2 has-focus-visible:ring-violet-500",
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={choice === p.id}
                    onChange={() => setChoice(p.id)}
                    className="accent-violet-600"
                    data-testid={`plan-${p.id}`}
                  />
                  {p.name}
                  {plan === p.id && <Badge tone="info">Current</Badge>}
                </span>
                <span className="mt-1 text-xl font-semibold tabular-nums">
                  {money(p.price)}
                  <span className="text-sm font-normal text-zinc-500">
                    {" "}
                    per month
                  </span>
                </span>
                <span className={cx("text-sm", muted)}>{p.detail}</span>
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className={cx(primary, "self-start")}
            disabled={choice === plan}
            data-testid="change-plan"
          >
            Change plan
          </button>
        </form>
      </Section>
      <Section title="Usage" body="Resets on the first of each month.">
        <dl className="grid gap-6 sm:grid-cols-2">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="font-medium">{u.label}</dt>
                <dd className="tabular-nums text-zinc-600">
                  {u.used}
                  {u.suffix} of{" "}
                  {u.limit ? `${u.limit}${u.suffix}` : "unlimited"}
                </dd>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={cx(
                    "h-full rounded-full",
                    u.limit && u.used / u.limit > 0.9
                      ? "bg-rose-500"
                      : "bg-violet-600",
                  )}
                  style={{
                    width: `${u.limit ? Math.min(100, (u.used / u.limit) * 100) : 8}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </dl>
      </Section>
      <Section
        title="Payment method"
        body="Receipts go to billing@northwind.io."
      >
        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-4 p-4",
          )}
        >
          <span className="flex items-center gap-3 text-sm">
            <span className="grid h-8 w-12 place-items-center rounded-md bg-zinc-900 text-[11px] font-bold text-white">
              Visa
            </span>
            <span>
              <span className="block font-medium">Visa ending in 4242</span>
              <span className={muted}>Expires 08/2028</span>
            </span>
          </span>
          <button
            type="button"
            className={secondary}
            onClick={() => toast("Payment method form opened")}
          >
            <CreditCard className="size-4" aria-hidden /> Update payment method
          </button>
        </div>
      </Section>
      <Section title="Invoices" body="The last six months.">
        <div className={cx(panel, "overflow-hidden")}>
          <div className="relative overflow-x-auto">
            <table
              className="w-full min-w-[30rem] text-sm"
              data-testid="invoices"
            >
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th scope="col" className={cx(th, "text-left")}>
                    Invoice
                  </th>
                  <th scope="col" className={cx(th, "text-left")}>
                    Date
                  </th>
                  <th scope="col" className={cx(th, "text-right")}>
                    Amount
                  </th>
                  <th scope="col" className={cx(th, "text-left")}>
                    Status
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50">
                    <th
                      scope="row"
                      className="px-4 py-2.5 text-left font-medium tabular-nums"
                    >
                      {inv.id}
                    </th>
                    <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                      {formatDate(inv.date)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {money(inv.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone="success">{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        className={textLink}
                        onClick={() => toast(`Download started for ${inv.id}`)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}

function SettingsPage({
  profile,
  billing,
}: {
  profile: ReactNode;
  billing: ReactNode;
}) {
  useDocumentTitle("Settings – Metricly");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "billing" ? "billing" : "profile";
  const setTab = (id: "profile" | "billing") =>
    setParams(id === "billing" ? { tab: id } : {}, { replace: true });
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
  ] as const;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Your profile and the Northwind workspace plan."
      />
      <div
        role="tablist"
        aria-label="Settings"
        className="flex gap-1 border-b border-zinc-200"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cx(
              "-mb-px rounded-t border-b-2 px-4 py-2 text-sm transition",
              focus,
              tab === t.id
                ? "border-violet-600 font-medium text-violet-700"
                : "border-transparent text-zinc-500 hover:text-zinc-900",
            )}
            data-testid={`settings-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="pt-2"
      >
        {tab === "profile" ? profile : billing}
      </div>
    </div>
  );
}

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  useDocumentTitle(`${title} – Metricly`);
  return (
    <div className="flex flex-col gap-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zinc-500">
          <ol className="flex items-center gap-1.5">
            <li>Account</li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-zinc-900">
              {title}
            </li>
          </ol>
        </nav>
        <PageHeader title={title} description={description} />
      </div>
      {children}
    </div>
  );
}

function NotFound({ home }: { home: string }) {
  useDocumentTitle("Page not found – Metricly");
  return (
    <div
      className="grid place-items-center py-24 text-center"
      data-testid="not-found"
    >
      <p className="text-5xl font-semibold tabular-nums text-violet-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className={cx("mt-2 max-w-sm text-sm", muted)}>
        This page has moved or no longer exists.
      </p>
      <Link to={home} className={cx(primary, "mt-6")} data-testid="go-home">
        Go to Overview
      </Link>
    </div>
  );
}

function Workspace({ toast }: { toast: (m: string) => void }) {
  return (
    <Menu
      label="Workspace menu for Northwind"
      triggerClassName={cx(
        "flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100",
        focus,
      )}
      trigger={
        <>
          <span className="grid size-6 shrink-0 place-items-center rounded bg-emerald-600 text-[11px] font-bold text-white">
            N
          </span>
          <span className="truncate font-medium">Northwind</span>
          <ChevronDown
            className="size-3.5 shrink-0 text-zinc-400"
            aria-hidden
          />
        </>
      }
      items={[
        {
          label: "Switch to Northwind staging",
          onSelect: () => toast("Switched to Northwind staging"),
        },
        {
          label: "Create workspace",
          onSelect: () => toast("Workspace setup opened"),
        },
      ]}
    />
  );
}

function TopBarActions({
  v,
  toast,
}: {
  v: boolean;
  toast: (m: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className={iconButton}
        aria-label="Help"
        onClick={() => toast("Help center opened")}
      >
        <CircleHelp className="size-5" aria-hidden />
      </button>
      <NotificationsMenu
        items={notifications}
        triggerClassName={cx("text-zinc-500", focus)}
      />
      <div className="ml-1 flex">
        <UserMenu
          name="Jordan Ellis"
          email="jordan.ellis@northwind.io"
          items={["Profile", "Billing"]}
          onSelect={(item) =>
            item === "Profile"
              ? navigate(v ? "/account/profile" : "/settings")
              : item === "Billing"
                ? navigate(v ? "/account/billing" : "/settings?tab=billing")
                : toast("Signed out")
          }
        />
      </div>
    </div>
  );
}

function GlobalSearch({
  reportsPath,
  className,
}: {
  reportsPath: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className={cx("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(
          q.trim()
            ? `${reportsPath}?q=${encodeURIComponent(q.trim())}`
            : reportsPath,
        );
      }}
    >
      <label htmlFor="global-search" className="sr-only">
        Search reports
      </label>
      <Search
        className="pointer-events-none absolute top-2.5 left-3 size-4 text-zinc-400"
        aria-hidden
      />
      <input
        id="global-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search reports"
        className={cx(input, "border-zinc-200 bg-zinc-100/70 pl-9 shadow-none")}
        data-testid="global-search"
      />
    </form>
  );
}

const sideLink = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
    focus,
    isActive
      ? "bg-violet-50 font-medium text-violet-800"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  );

const topLink = ({ isActive }: { isActive: boolean }) =>
  cx(
    "-mb-px flex shrink-0 items-center gap-2 rounded-t-md border-b-2 px-3 py-2.5 text-sm transition",
    focus,
    isActive
      ? "border-violet-600 font-medium text-zinc-900"
      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900",
  );

function Count({ value }: { value: number }) {
  return value > 0 ? (
    <span className="ml-auto rounded-full bg-rose-100 px-1.5 text-xs font-medium tabular-nums text-rose-700">
      {value}
    </span>
  ) : null;
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [alerts, setAlerts] = useState(seedAlerts);
  const [exports, setExports] = useState(seedExports);
  const [range, setRange] = useState<Range>("30d");
  const [segment, setSegment] = useState<Segment>("All platforms");
  const [profile, setProfile] = useState<Profile>({
    name: "Jordan Ellis",
    email: "jordan.ellis@northwind.io",
    timezone: "America/New_York",
  });
  const [plan, setPlan] = useState("growth");
  const [toasts, toast] = useToasts("bg-zinc-900 text-white");
  const filters: Filters = { range, setRange, segment, setSegment };
  const triggered = alerts.filter(isTriggered).length;

  const createAlert = (a: Omit<Alert, "id" | "paused" | "lastTriggered">) => {
    setAlerts((current) => [
      { ...a, id: `a${Date.now()}`, paused: false, lastTriggered: null },
      ...current,
    ]);
    toast(`Alert “${a.name}” created`);
  };
  const updateAlert = (id: string, patch: Partial<Alert>) => {
    setAlerts((current) =>
      current.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
    toast(patch.paused ? "Alert paused" : "Alert resumed");
  };
  const deleteAlert = (id: string) => {
    setAlerts((current) => current.filter((a) => a.id !== id));
    toast("Alert deleted");
  };
  const addExport = (row: ExportRow) =>
    setExports((current) => [row, ...current]);
  const saveProfile = (p: Profile) => {
    setProfile(p);
    toast("Profile saved");
  };
  const changePlan = (id: string) => {
    setPlan(id);
    toast(`Plan changed to ${plans.find((p) => p.id === id)?.name}`);
  };

  const profileForm = <ProfileForm profile={profile} onSave={saveProfile} />;
  const billingForm = (
    <BillingForm plan={plan} onChange={changePlan} toast={toast} />
  );
  const alertsPage = (
    <AlertsPage
      alerts={alerts}
      onCreate={createAlert}
      onUpdate={updateAlert}
      onDelete={deleteAlert}
    />
  );
  const home = v ? "/overview" : "/dashboard";
  const reportsPath = v ? "/insights" : "/reports";

  const topNav = [
    { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/reports", label: "Reports", Icon: FileBarChart },
    { to: "/exports", label: "Exports", Icon: Download },
    { to: "/alerts", label: "Alerts", Icon: Bell },
    { to: "/settings", label: "Settings", Icon: Settings },
  ];
  const sideNav = [
    {
      group: "Analyze",
      items: [
        { to: "/overview", label: "Overview", Icon: LayoutDashboard },
        { to: "/insights", label: "Insights", Icon: Lightbulb },
      ],
    },
    {
      group: "Monitor",
      items: [{ to: "/alerts", label: "Alerts", Icon: Bell }],
    },
    {
      group: "Account",
      items: [
        { to: "/account/profile", label: "Profile", Icon: User },
        { to: "/account/billing", label: "Billing", Icon: CreditCard },
      ],
    },
  ];

  const routes = v ? (
    <Routes>
      <Route index element={<Navigate to={home} replace />} />
      <Route
        path="overview"
        element={
          <Dashboard
            title="Overview"
            reportsPath="/insights"
            filters={filters}
          />
        }
      />
      <Route
        path="insights"
        element={
          <ReportsPage
            title="Insights"
            withExport
            toast={toast}
            filters={filters}
            exports={exports}
            onExport={addExport}
          />
        }
      />
      <Route path="alerts" element={alertsPage} />
      <Route
        path="account"
        element={<Navigate to="/account/profile" replace />}
      />
      <Route
        path="account/profile"
        element={
          <Page
            title="Profile"
            description="How you appear to your team and where we reach you."
          >
            {profileForm}
          </Page>
        }
      />
      <Route
        path="account/billing"
        element={
          <Page
            title="Billing"
            description="Your plan, usage, payment method and invoices."
          >
            {billingForm}
          </Page>
        }
      />
      <Route path="*" element={<NotFound home={home} />} />
    </Routes>
  ) : (
    <Routes>
      <Route index element={<Navigate to={home} replace />} />
      <Route
        path="dashboard"
        element={
          <Dashboard
            title="Dashboard"
            reportsPath="/reports"
            filters={filters}
          />
        }
      />
      <Route
        path="reports"
        element={
          <ReportsPage
            title="Reports"
            withExport={false}
            toast={toast}
            filters={filters}
            exports={exports}
            onExport={addExport}
          />
        }
      />
      <Route
        path="exports"
        element={
          <ExportsPage
            toast={toast}
            range={range}
            exports={exports}
            onExport={addExport}
          />
        }
      />
      <Route path="alerts" element={alertsPage} />
      <Route
        path="settings"
        element={<SettingsPage profile={profileForm} billing={billingForm} />}
      />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="px-2">
          <Logo />
        </div>
        <Workspace toast={toast} />
      </div>
      <nav aria-label="Main" className="flex flex-col gap-6">
        {sideNav.map(({ group, items }) => (
          <div key={group}>
            <h2
              id={`nav-${group.toLowerCase()}`}
              className="px-3 text-xs font-medium text-zinc-400"
            >
              {group}
            </h2>
            <ul
              aria-labelledby={`nav-${group.toLowerCase()}`}
              className="mt-1.5 flex flex-col gap-0.5"
            >
              {items.map(({ to, label, Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={sideLink}
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                    {to === "/alerts" && <Count value={triggered} />}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-auto rounded-lg bg-zinc-50 p-3 text-sm">
        <p className="font-medium">
          {plans.find((p) => p.id === plan)?.name} plan
        </p>
        <p className={cx("text-xs", muted)}>3.2M events used this month</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-[64%] rounded-full bg-violet-600" />
        </div>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <div style={font} className="text-zinc-900">
        {v ? (
          <div className="flex min-h-screen bg-zinc-50">
            <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-zinc-200 bg-white p-4 md:block">
              {sidebar}
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-zinc-200 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
                <MobileNav
                  label="Navigation"
                  className="bg-white text-zinc-900"
                >
                  <div className="mt-2 h-[calc(100dvh-4rem)]" style={font}>
                    {sidebar}
                  </div>
                </MobileNav>
                <GlobalSearch
                  reportsPath={reportsPath}
                  className="min-w-0 flex-1 sm:max-w-sm"
                />
                <div className="ml-auto">
                  <TopBarActions v={v} toast={toast} />
                </div>
              </header>
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
                {routes}
              </main>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-zinc-50">
            <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
              <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 pt-2.5 sm:gap-3 sm:px-6">
                <Logo />
                <span className="text-zinc-300" aria-hidden>
                  /
                </span>
                <Workspace toast={toast} />
                <GlobalSearch
                  reportsPath={reportsPath}
                  className="ml-auto hidden w-64 sm:block"
                />
                <div className="ml-auto sm:ml-0">
                  <TopBarActions v={v} toast={toast} />
                </div>
              </div>
              <nav
                aria-label="Main"
                className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pt-1 sm:px-6"
              >
                {topNav.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={topLink}
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                    {to === "/alerts" && <Count value={triggered} />}
                  </NavLink>
                ))}
              </nav>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              {routes}
            </main>
          </div>
        )}
        {toasts}
      </div>
    </HashRouter>
  );
}
