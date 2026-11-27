import {
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  Download,
  FileBarChart,
  LayoutDashboard,
  Lightbulb,
  Plus,
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
  useSearchParams,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";

type Point = { label: string; value: number };
type Report = {
  id: string;
  name: string;
  description: string;
  unit: string;
  points: Point[];
};
type Alert = {
  id: string;
  name: string;
  metric: string;
  condition: "above" | "below";
  threshold: number;
};
type Profile = { name: string; email: string; timezone: string };

const reports: Report[] = [
  {
    id: "wau",
    name: "Weekly active users",
    description: "Unique users who opened the product each week.",
    unit: "",
    points: [
      { label: "Oct 6", value: 18420 },
      { label: "Oct 13", value: 19105 },
      { label: "Oct 20", value: 18870 },
      { label: "Oct 27", value: 20310 },
      { label: "Nov 3", value: 21240 },
      { label: "Nov 10", value: 22015 },
      { label: "Nov 17", value: 23480 },
    ],
  },
  {
    id: "revenue",
    name: "Revenue by plan",
    description: "Monthly recurring revenue split by plan.",
    unit: "$",
    points: [
      { label: "Starter", value: 38200 },
      { label: "Growth", value: 96400 },
      { label: "Scale", value: 142800 },
      { label: "Enterprise", value: 211500 },
    ],
  },
  {
    id: "funnel",
    name: "Signup funnel",
    description: "Visitors who reached each signup step last month.",
    unit: "",
    points: [
      { label: "Visited", value: 52400 },
      { label: "Started", value: 14800 },
      { label: "Verified", value: 9120 },
      { label: "Activated", value: 6340 },
    ],
  },
  {
    id: "churn",
    name: "Churn by cohort",
    description: "Share of accounts lost within 90 days, by signup month.",
    unit: "%",
    points: [
      { label: "Jun", value: 6.8 },
      { label: "Jul", value: 5.9 },
      { label: "Aug", value: 5.2 },
      { label: "Sep", value: 4.7 },
      { label: "Oct", value: 4.1 },
    ],
  },
];

const metrics = [
  "Weekly active users",
  "MRR",
  "Signup conversion",
  "Churn rate",
  "Error rate",
];

const seedAlerts: Alert[] = [
  {
    id: "a1",
    name: "Churn spike",
    metric: "Churn rate",
    condition: "above",
    threshold: 6,
  },
  {
    id: "a2",
    name: "Signups dropped",
    metric: "Signup conversion",
    condition: "below",
    threshold: 10,
  },
];

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    detail: "3 seats, 10 reports",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$199/mo",
    detail: "15 seats, unlimited reports",
  },
  {
    id: "scale",
    name: "Scale",
    price: "$599/mo",
    detail: "Unlimited seats, SSO, alerts API",
  },
];

const kpis = [
  { label: "Active users", value: "23,480", change: "+6.7%" },
  { label: "MRR", value: "$488,900", change: "+3.2%" },
  { label: "Conversion", value: "12.1%", change: "+0.4 pt" },
  { label: "Churn", value: "4.1%", change: "−0.6 pt" },
];

const format = (report: Report, value: number) =>
  report.unit === "$"
    ? `$${value.toLocaleString("en-US")}`
    : report.unit === "%"
      ? `${value}%`
      : value.toLocaleString("en-US");

const input =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200";
const primary =
  "inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500";
const card = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";

function Bars({ report }: { report: Report }) {
  const max = Math.max(...report.points.map((p) => p.value));
  return (
    <ul
      className="flex h-48 items-end gap-3"
      aria-label={`${report.name} chart`}
      data-testid={`chart-${report.id}`}
    >
      {report.points.map((p) => (
        <li
          key={p.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1"
        >
          <span className="text-xs text-slate-500">
            {format(report, p.value)}
          </span>
          <span
            className="w-full rounded-t bg-sky-500"
            style={{ height: `${(p.value / max) * 80}%` }}
          />
          <span className="text-xs text-slate-600">{p.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({
  title,
  reportsPath,
}: {
  title: string;
  reportsPath: string;
}) {
  const wau = reports[0];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={card}
            data-testid={`kpi-${k.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="text-sm text-slate-500">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold">{k.value}</div>
            <div className="mt-1 text-xs font-medium text-emerald-600">
              {k.change} vs last month
            </div>
          </div>
        ))}
      </div>
      <section className={card} aria-labelledby="dash-wau">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="dash-wau" className="font-medium">
            {wau.name}
          </h2>
          <Link
            to={`${reportsPath}?report=wau`}
            className="text-sm text-sky-700 hover:underline"
            data-testid="view-reports"
          >
            View all reports
          </Link>
        </div>
        <Bars report={wau} />
      </section>
    </div>
  );
}

function ExportSection({
  initial,
  toast,
  headingLevel,
}: {
  initial: string;
  toast: (m: string) => void;
  headingLevel: "h1" | "h2";
}) {
  const [reportId, setReportId] = useState(initial);
  const [fileType, setFileType] = useState("CSV");
  const Heading = headingLevel;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const report = reports.find((r) => r.id === reportId) ?? reports[0];
    toast(`Exported ${report.name} as ${fileType}`);
  };
  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-4">
      <Heading
        id="export-heading"
        className={
          headingLevel === "h1"
            ? "text-2xl font-semibold"
            : "text-lg font-semibold"
        }
      >
        Export
      </Heading>
      <form
        onSubmit={submit}
        className={cx(card, "flex flex-wrap items-end gap-4")}
      >
        <label className="flex min-w-56 flex-col gap-1 text-sm font-medium">
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
        <fieldset className="flex gap-4 text-sm">
          <legend className="mb-1 font-medium">Format</legend>
          {["CSV", "PDF", "XLSX"].map((f) => (
            <label key={f} className="flex items-center gap-1">
              <input
                type="radio"
                name="format"
                value={f}
                checked={fileType === f}
                onChange={() => setFileType(f)}
                data-testid={`export-format-${f.toLowerCase()}`}
              />
              {f}
            </label>
          ))}
        </fieldset>
        <button type="submit" className={primary} data-testid="export-report">
          <Download className="size-4" aria-hidden /> Export
        </button>
      </form>
    </section>
  );
}

function ReportsPage({
  title,
  withExport,
  toast,
}: {
  title: string;
  withExport: boolean;
  toast: (m: string) => void;
}) {
  const [params] = useSearchParams();
  const initial = params.get("report");
  const [selected, setSelected] = useState(initial ?? reports[0].id);
  const report = reports.find((r) => r.id === selected) ?? reports[0];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <ul className="flex flex-col gap-1" aria-label="Reports">
          {reports.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={r.id === report.id}
                onClick={() => setSelected(r.id)}
                className={cx(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                  r.id === report.id
                    ? "bg-sky-50 font-medium text-sky-800"
                    : "hover:bg-slate-100",
                )}
                data-testid={`report-${r.id}`}
              >
                <FileBarChart className="size-4 shrink-0" aria-hidden />{" "}
                {r.name}
              </button>
            </li>
          ))}
        </ul>
        <section
          className={card}
          aria-labelledby="report-title"
          data-testid="report-detail"
        >
          <h2 id="report-title" className="text-lg font-semibold">
            {report.name}
          </h2>
          <p className="mb-6 text-sm text-slate-500">{report.description}</p>
          <Bars report={report} />
        </section>
      </div>
      {withExport && (
        <ExportSection
          key={report.id}
          initial={report.id}
          toast={toast}
          headingLevel="h2"
        />
      )}
    </div>
  );
}

function AlertsPage({
  alerts,
  onCreate,
}: {
  alerts: Alert[];
  onCreate: (a: Omit<Alert, "id">) => void;
}) {
  const [open, setOpen] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onCreate({
      name: String(data.get("name")),
      metric: String(data.get("metric")),
      condition: data.get("condition") === "below" ? "below" : "above",
      threshold: Number(data.get("threshold")),
    });
    setOpen(false);
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <button
          type="button"
          className={primary}
          onClick={() => setOpen(true)}
          data-testid="new-alert"
        >
          <Plus className="size-4" aria-hidden /> New alert
        </button>
      </div>
      <ul className="flex flex-col gap-3" data-testid="alert-list">
        {alerts.map((a) => (
          <li key={a.id} className={cx(card, "flex items-center gap-3")}>
            <Bell className="size-4 text-sky-600" aria-hidden />
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-slate-500">
                {a.metric} {a.condition} {a.threshold}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New alert"
        testId="alert-dialog"
        className="w-full max-w-md rounded-lg bg-white p-6 text-slate-900"
      >
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Name
            <input
              name="name"
              required
              className={input}
              data-testid="alert-name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Metric
            <select name="metric" className={input} data-testid="alert-metric">
              {metrics.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
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
            <label className="flex flex-col gap-1 text-sm font-medium">
              Threshold
              <input
                name="threshold"
                type="number"
                step="any"
                required
                className={input}
                data-testid="alert-threshold"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
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

function ProfileForm({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  return (
    <form
      className={cx(card, "flex max-w-lg flex-col gap-4")}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Full name
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          required
          autoComplete="name"
          className={input}
          data-testid="profile-name"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          type="email"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          required
          autoComplete="email"
          className={input}
          data-testid="profile-email"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Time zone
        <select
          value={draft.timezone}
          onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
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
      <button
        type="submit"
        className={cx(primary, "self-start")}
        data-testid="save-profile"
      >
        Save
      </button>
    </form>
  );
}

function BillingForm({
  plan,
  onChange,
}: {
  plan: string;
  onChange: (plan: string) => void;
}) {
  const [choice, setChoice] = useState(plan);
  return (
    <form
      className="flex max-w-3xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(choice);
      }}
    >
      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium">Plan</legend>
        {plans.map((p) => (
          <label
            key={p.id}
            className={cx(
              card,
              "flex cursor-pointer flex-col gap-1 has-checked:border-sky-500 has-checked:ring-2 has-checked:ring-sky-200",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="plan"
                value={p.id}
                checked={choice === p.id}
                onChange={() => setChoice(p.id)}
                data-testid={`plan-${p.id}`}
              />
              {p.name}
              {plan === p.id && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  Current
                </span>
              )}
            </span>
            <span className="text-lg font-semibold">{p.price}</span>
            <span className="text-sm text-slate-500">{p.detail}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        className={cx(primary, "self-start disabled:opacity-50")}
        disabled={choice === plan}
        data-testid="change-plan"
      >
        Change plan
      </button>
    </form>
  );
}

function SettingsPage({
  profile,
  billing,
}: {
  profile: ReactNode;
  billing: ReactNode;
}) {
  const [tab, setTab] = useState<"profile" | "billing">("profile");
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
  ] as const;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div
        role="tablist"
        aria-label="Settings"
        className="flex gap-1 border-b border-slate-200"
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
              "-mb-px border-b-2 px-4 py-2 text-sm",
              tab === t.id
                ? "border-sky-600 font-medium text-sky-700"
                : "border-transparent text-slate-500",
            )}
            data-testid={`settings-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "profile" ? profile : billing}
      </div>
    </div>
  );
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

function NotFound({ home }: { home: string }) {
  return (
    <div
      className="grid place-items-center py-24 text-center"
      data-testid="not-found"
    >
      <p className="text-5xl font-semibold text-sky-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        This page has moved or no longer exists.
      </p>
      <Link to={home} className={cx(primary, "mt-6")} data-testid="go-home">
        Go to Overview
      </Link>
    </div>
  );
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
    isActive
      ? "bg-sky-50 font-medium text-sky-800"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  );

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold" data-testid="logo">
      <span className="grid size-8 place-items-center rounded-md bg-sky-600 text-white">
        <Activity className="size-4" aria-hidden />
      </span>
      Metricly
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [alerts, setAlerts] = useState(seedAlerts);
  const [profile, setProfile] = useState<Profile>({
    name: "Jordan Ellis",
    email: "jordan.ellis@northwind.io",
    timezone: "America/New_York",
  });
  const [plan, setPlan] = useState("growth");
  const [toasts, toast] = useToasts("bg-slate-900 text-white");

  const createAlert = (a: Omit<Alert, "id">) => {
    setAlerts((current) => [...current, { ...a, id: `a${Date.now()}` }]);
    toast(`Alert "${a.name}" created`);
  };
  const saveProfile = (p: Profile) => {
    setProfile(p);
    toast("Profile updated");
  };
  const changePlan = (id: string) => {
    setPlan(id);
    toast(`Plan changed to ${plans.find((p) => p.id === id)?.name}`);
  };

  const profileForm = <ProfileForm profile={profile} onSave={saveProfile} />;
  const billingForm = <BillingForm plan={plan} onChange={changePlan} />;
  const alertsPage = <AlertsPage alerts={alerts} onCreate={createAlert} />;
  const home = v ? "/overview" : "/dashboard";

  const topNav = [
    { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/reports", label: "Reports", Icon: BarChart3 },
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
        element={<Dashboard title="Overview" reportsPath="/insights" />}
      />
      <Route
        path="insights"
        element={<ReportsPage title="Insights" withExport toast={toast} />}
      />
      <Route path="alerts" element={alertsPage} />
      <Route
        path="account"
        element={<Navigate to="/account/profile" replace />}
      />
      <Route
        path="account/profile"
        element={<Page title="Profile">{profileForm}</Page>}
      />
      <Route
        path="account/billing"
        element={<Page title="Billing">{billingForm}</Page>}
      />
      <Route path="*" element={<NotFound home={home} />} />
    </Routes>
  ) : (
    <Routes>
      <Route index element={<Navigate to={home} replace />} />
      <Route
        path="dashboard"
        element={<Dashboard title="Dashboard" reportsPath="/reports" />}
      />
      <Route
        path="reports"
        element={
          <ReportsPage title="Reports" withExport={false} toast={toast} />
        }
      />
      <Route
        path="exports"
        element={
          <ExportSection
            initial={reports[0].id}
            toast={toast}
            headingLevel="h1"
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

  return (
    <HashRouter>
      {v ? (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
          <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
            <Logo />
            <nav aria-label="Main" className="mt-8 flex flex-col gap-6">
              {sideNav.map(({ group, items }) => (
                <div key={group}>
                  <h2
                    id={`nav-${group.toLowerCase()}`}
                    className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {group}
                  </h2>
                  <ul
                    aria-labelledby={`nav-${group.toLowerCase()}`}
                    className="mt-2 flex flex-col gap-1"
                  >
                    {items.map(({ to, label, Icon }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          className={navLink}
                          data-testid={`nav-${label.toLowerCase()}`}
                        >
                          <Icon className="size-4" aria-hidden /> {label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-8">{routes}</main>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-3">
              <Logo />
              <nav aria-label="Main" className="flex gap-1">
                {topNav.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={navLink}
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl p-6">{routes}</main>
        </div>
      )}
      {toasts}
    </HashRouter>
  );
}
