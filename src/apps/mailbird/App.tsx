import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cookie,
  Copy,
  Crown,
  Eye,
  FileText,
  Gift,
  Loader2,
  MailOpen,
  MousePointerClick,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Avatar,
  Badge,
  daysFromToday,
  EmptyState,
  formatDate,
  MobileNav,
  NotificationsMenu,
  relativeTime,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import {
  type Campaign,
  type Contact,
  type ContactStatus,
  links,
  notifications,
  type Segment,
  type Status,
  seedCampaigns,
  seedContacts,
  segmentById,
  segmentLabel,
  segments,
} from "./data";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]";
const primary =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#15803D] px-3.5 text-sm font-medium text-white shadow-sm hover:bg-[#166534] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] disabled:cursor-not-allowed disabled:opacity-50";
const ghost =
  "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]";
const iconButton =
  "grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]";
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#15803D] focus:outline-none focus:ring-3 focus:ring-[#15803D]/15 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500/15";
const input = `${field} h-9`;
const inlineSelect =
  "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs focus:border-[#15803D] focus:outline-none focus:ring-3 focus:ring-[#15803D]/15";
const labelText = "text-sm font-medium text-slate-800";
const panel = "rounded-xl border border-slate-200 bg-white shadow-xs";
const dialog =
  "w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl";
const link =
  "rounded-sm font-medium text-slate-900 hover:text-[#15803D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]";

const statusTone: Record<Status, "neutral" | "info" | "success"> = {
  Draft: "neutral",
  Scheduled: "info",
  Sent: "success",
};

const contactTone: Record<ContactStatus, "success" | "neutral" | "danger"> = {
  Subscribed: "success",
  Unsubscribed: "neutral",
  Bounced: "danger",
};

const number = (value: number) => value.toLocaleString("en-US");
const percent = (part: number, whole: number) =>
  whole ? `${((part / whole) * 100).toFixed(1)}%` : "–";

function seeded(key: string) {
  let hash = 7;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

function edited(date: string) {
  const value = relativeTime(date);
  return /\d{4}/.test(value) ? `on ${value}` : value.toLowerCase();
}

function campaignDate(campaign: Campaign) {
  if (campaign.status === "Draft") return `Edited ${edited(campaign.date)}`;
  if (campaign.status === "Scheduled")
    return `${formatDate(campaign.date)}, ${campaign.time}`;
  return formatDate(campaign.date);
}

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#15803D" />
      <path
        d="M6.5 19.5c3.6.4 6.6-.9 8.6-4.1 1.7-2.8 3.9-4.7 7.4-4.9 1.1 0 2 .3 2.9.9l2.1-.4-1.4 1.8c.1 4.5-3.2 8.7-8.6 9.4-4.4.6-8.5-.6-11-2.7Z"
        fill="#fff"
      />
      <path d="M13 21.5 9.5 26l6.2-4.2" fill="#BBF7D0" />
      <circle cx="22.2" cy="13.4" r="1.1" fill="#15803D" />
    </svg>
  );
}

function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

function SortHeader<K extends string>({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: K;
  sort: { key: K | null; dir: "asc" | "desc" };
  onSort: (key: K) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={cx(
        "px-4 py-2.5 font-medium",
        align === "right" && "text-right",
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cx(
          "inline-flex items-center gap-1 rounded-sm hover:text-slate-900",
          focus,
          active && "text-slate-900",
        )}
      >
        {label}
        <Icon className="size-3.5 opacity-60" aria-hidden />
      </button>
    </th>
  );
}

function useSort<K extends string>() {
  const [sort, setSort] = useState<{ key: K | null; dir: "asc" | "desc" }>({
    key: null,
    dir: "asc",
  });
  const onSort = (key: K) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  return [sort, onSort] as const;
}

function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <p className="tabular-nums" data-testid="result-count">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cx(iconButton, "disabled:opacity-40")}
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="px-2 tabular-nums">
          Page {page + 1} of {pages}
        </span>
        <button
          type="button"
          className={cx(iconButton, "disabled:opacity-40")}
          aria-label="Next page"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-950">
        {value}
      </dd>
      {hint && <dd className="mt-0.5 text-xs text-slate-500">{hint}</dd>}
    </div>
  );
}

type CampaignKey = "name" | "status" | "date" | "recipients" | "open" | "click";

function CampaignList({ v, campaigns }: { v: boolean; campaigns: Campaign[] }) {
  useDocumentTitle("Campaigns – Mailbird");
  const [loading, setLoading] = useState(v);
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [status, setStatus] = useState<Status | "All">("All");
  const [segment, setSegment] = useState("any");
  const [sort, onSort] = useSort<CampaignKey>();
  const [page, setPage] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    if (!v) return;
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [v]);

  useEffect(() => setPage(0), [query, status, segment, sort.key, sort.dir]);

  const sent = campaigns.filter((c) => c.status === "Sent");
  const recent = sent.filter((c) => c.date >= daysFromToday(-30));
  const totals = recent.reduce(
    (sum, c) => ({
      recipients: sum.recipients + c.recipients,
      opens: sum.opens + c.opens,
      clicks: sum.clicks + c.clicks,
      unsubscribes: sum.unsubscribes + c.unsubscribes,
    }),
    { recipients: 0, opens: 0, clicks: 0, unsubscribes: 0 },
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = campaigns.filter(
      (c) =>
        (status === "All" || c.status === status) &&
        (segment === "any" || c.segment === segment) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)),
    );
    if (!sort.key) return list;
    const value = (c: Campaign): string | number => {
      switch (sort.key) {
        case "name":
          return c.name.toLowerCase();
        case "status":
          return c.status;
        case "date":
          return c.date;
        case "recipients":
          return c.recipients;
        case "open":
          return c.recipients ? c.opens / c.recipients : -1;
        default:
          return c.recipients ? c.clicks / c.recipients : -1;
      }
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) =>
      value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0,
    );
  }, [campaigns, query, status, segment, sort]);

  const shown = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const counts = (s: Status | "All") =>
    s === "All"
      ? campaigns.length
      : campaigns.filter((c) => c.status === s).length;
  const filtersOn = Boolean(query) || status !== "All" || segment !== "any";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Campaigns"
        description="Write, schedule, and send emails to your audience."
        actions={
          <Link
            to="/campaigns/new"
            className={primary}
            data-testid="new-campaign"
          >
            <Plus className="size-4" aria-hidden /> New campaign
          </Link>
        }
      />

      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-slate-200 py-5 lg:grid-cols-4">
        <Stat
          label="Emails sent"
          value={number(totals.recipients)}
          hint={`${recent.length} campaigns in the last 30 days`}
        />
        <Stat
          label="Average open rate"
          value={percent(totals.opens, totals.recipients)}
          hint="Industry average is 32.4%"
        />
        <Stat
          label="Average click rate"
          value={percent(totals.clicks, totals.recipients)}
          hint="Unique clicks over delivered"
        />
        <Stat
          label="Unsubscribes"
          value={number(totals.unsubscribes)}
          hint={percent(totals.unsubscribes, totals.recipients)}
        />
      </dl>

      <section className={panel} aria-label="Campaign list">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filter by status"
          >
            {(["All", "Sent", "Scheduled", "Draft"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                data-testid={`status-filter-${s.toLowerCase()}`}
                className={cx(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm",
                  focus,
                  status === s
                    ? "bg-[#15803D]/10 font-medium text-[#166534]"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {s === "All" ? "All campaigns" : s}
                <span className="tabular-nums text-xs opacity-70">
                  {counts(s)}
                </span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
              <span className="sr-only">Search campaigns</span>
              <Search
                className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) =>
                  setParams(e.target.value ? { q: e.target.value } : {}, {
                    replace: true,
                  })
                }
                placeholder="Search by name or subject"
                className={cx(input, "pl-9")}
                data-testid="campaign-search"
              />
            </label>
            <label className="sr-only" htmlFor="segment-filter">
              Audience
            </label>
            <select
              id="segment-filter"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className={inlineSelect}
            >
              <option value="any">Any audience</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <SortHeader
                  label="Campaign"
                  column="name"
                  sort={sort}
                  onSort={onSort}
                />
                <SortHeader
                  label="Status"
                  column="status"
                  sort={sort}
                  onSort={onSort}
                />
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Audience
                </th>
                <SortHeader
                  label="Date"
                  column="date"
                  sort={sort}
                  onSort={onSort}
                />
                <SortHeader
                  label="Recipients"
                  column="recipients"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <SortHeader
                  label="Open rate"
                  column="open"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <SortHeader
                  label="Click rate"
                  column="click"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
              </tr>
            </thead>
            {loading ? (
              <tbody data-testid="campaign-skeleton" aria-busy="true">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-t border-slate-100">
                    {[0, 1, 2, 3, 4, 5, 6].map((cell) => (
                      <td key={cell} className="px-4 py-4">
                        <div
                          className={cx(
                            "h-3 animate-shimmer rounded bg-slate-200",
                            cell === 0 ? "w-48" : "w-16",
                            cell > 3 && "ml-auto",
                          )}
                        />
                        {cell === 0 && (
                          <div className="mt-2 h-2.5 w-32 animate-shimmer rounded bg-slate-100" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody data-testid="campaign-list">
                {shown.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-100 first:border-t-0 hover:bg-slate-50/70"
                    data-testid={`campaign-${c.id}`}
                  >
                    <td className="max-w-80 px-4 py-3">
                      <Link
                        to={`/campaigns/${c.id}`}
                        className={cx(link, "block truncate")}
                        title={c.name}
                      >
                        {c.name}
                      </Link>
                      <p className="truncate text-slate-500" title={c.subject}>
                        {c.subject}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {segmentById(c.segment).name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                      {campaignDate(c)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {c.recipients ? number(c.recipients) : "–"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {c.status === "Sent"
                        ? percent(c.opens, c.recipients)
                        : "–"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {c.status === "Sent"
                        ? percent(c.clicks, c.recipients)
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<Search className="size-5" aria-hidden />}
            title="No campaigns match"
            body="Try a different search or clear the filters to see every campaign."
            action={
              filtersOn && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => {
                    setStatus("All");
                    setSegment("any");
                    setParams({}, { replace: true });
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        )}
        {!loading && filtered.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
          />
        )}
      </section>
    </div>
  );
}

function EmailPreview({
  subject,
  preview,
  body,
  compact,
}: {
  subject: string;
  preview: string;
  body: string;
  compact?: boolean;
}) {
  const paragraphs = (
    body.trim() || "Your email body appears here as you write it."
  )
    .replaceAll("{first_name}", "Maya")
    .split(/\n{2,}/);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <BrandMark size={32} />
        <div className="min-w-0 text-sm">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-slate-900">
              Fernhill Roasters
            </span>
            <span className="text-xs text-slate-500">
              hello@fernhillroasters.com
            </span>
          </p>
          <p className="truncate font-medium text-slate-800" title={subject}>
            {subject || "Your subject line"}
          </p>
          <p className="truncate text-slate-500">
            {preview || "Preview text shows here in the inbox"}
          </p>
        </div>
      </div>
      <div className={cx("bg-[#F6F7F4]", compact ? "p-4" : "p-6")}>
        <div className="mx-auto max-w-md rounded-lg bg-white px-6 py-6 shadow-xs">
          <p className="text-lg font-semibold tracking-tight text-[#14532D]">
            Fernhill Roasters
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {paragraphs.map((p, i) => (
              <p
                key={`${i}-${p.slice(0, 12)}`}
                className="whitespace-pre-line break-words"
              >
                {p}
              </p>
            ))}
          </div>
          <span className="mt-6 inline-flex rounded-md bg-[#15803D] px-4 py-2 text-sm font-medium text-white">
            Shop the roast
          </span>
          <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
            Fernhill Roasters, 14 Mill Lane, Portland, OR. You get this email
            because you subscribed on our site. Unsubscribe or update your
            preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

function Editor({
  v,
  add,
  toast,
}: {
  v: boolean;
  add: (c: Campaign) => void;
  toast: (m: string) => void;
}) {
  useDocumentTitle("New campaign – Mailbird");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [audience, setAudience] = useState(segmentLabel(segments[0]));
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [date, setDate] = useState(daysFromToday(3));
  const [time, setTime] = useState("09:00");
  const [checking, setChecking] = useState(v);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const segment: Segment =
    segments.find((s) => segmentLabel(s) === audience) ?? segments[0];

  useEffect(() => {
    if (!v) return;
    const timer = setTimeout(() => setChecking(false), 2000);
    return () => clearTimeout(timer);
  }, [v]);

  function openSchedule() {
    if (v) setUpsellOpen(true);
    else setScheduleOpen(true);
  }

  function confirmSchedule(event: FormEvent) {
    event.preventDefault();
    setSchedule({ date, time });
    setScheduleOpen(false);
    toast(`Scheduled for ${formatDate(date)} at ${time}`);
  }

  function send() {
    add({
      id: `c-${Date.now()}`,
      name: name.trim() || "Untitled campaign",
      subject: subject.trim() || "(no subject)",
      preview: preview.trim(),
      segment: segment.id,
      status: schedule ? "Scheduled" : "Sent",
      date: schedule ? schedule.date : daysFromToday(0),
      time: schedule ? schedule.time : "",
      recipients: schedule ? 0 : segment.count,
      opens: 0,
      clicks: 0,
      unsubscribes: 0,
      bounces: 0,
      author: "Priya Raman",
      body,
    });
    toast(schedule ? "Campaign scheduled" : "Campaign sent");
    navigate("/");
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    if (code !== "123456") {
      setCodeError("That code is incorrect. Check it and try again.");
      return;
    }
    setVerifyOpen(false);
    send();
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                to="/"
                className={cx("rounded-sm hover:text-slate-900", focus)}
              >
                Campaigns
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-slate-700">
              New campaign
            </li>
          </ol>
        </nav>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          New campaign
        </h1>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            className={cx(panel, "flex flex-col gap-5 p-5 sm:p-6")}
            aria-label="Campaign details"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelText}>Campaign name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="December newsletter"
                  className={input}
                  data-testid="campaign-name"
                />
                <span className="text-xs text-slate-500">
                  Only your team sees this.
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelText}>Audience</span>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className={input}
                  data-testid="campaign-audience"
                >
                  {segments.map((s) => (
                    <option key={s.id} value={segmentLabel(s)}>
                      {segmentLabel(s)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">
                  {segment.description}.
                </span>
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-baseline justify-between">
                <span className={labelText}>Subject line</span>
                <span
                  className={cx(
                    "text-xs tabular-nums",
                    subject.length > 60 ? "text-amber-700" : "text-slate-400",
                  )}
                >
                  {subject.length}/60
                </span>
              </span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's new this month"
                className={input}
                data-testid="campaign-subject"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelText}>Preview text</span>
              <input
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                placeholder="Shown after the subject in most inboxes"
                className={input}
                data-testid="campaign-preview"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelText}>Email body</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Hi {first_name},"
                className={cx(field, "py-2 leading-6")}
                data-testid="campaign-body"
              />
              <span className="text-xs text-slate-500">
                Use {"{first_name}"} to greet each subscriber by name.
              </span>
            </label>
          </section>

          <section
            className={cx(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
              checking
                ? "border-slate-200 bg-white text-slate-600"
                : "border-[#15803D]/20 bg-[#F0FDF4] text-[#14532D]",
            )}
            data-testid="deliverability"
            aria-live="polite"
          >
            {checking ? (
              <>
                <Loader2
                  className="mt-0.5 size-4 shrink-0 animate-spin text-[#15803D]"
                  aria-hidden
                />
                Checking deliverability…
              </>
            ) : (
              <>
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-[#15803D]"
                  aria-hidden
                />
                Deliverability looks good: SPF and DKIM pass, no spam triggers
                found.
              </>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {schedule && (
              <span
                className="mr-auto inline-flex items-center gap-2 text-sm text-slate-600"
                data-testid="schedule-summary"
              >
                <CalendarClock className="size-4 text-[#15803D]" aria-hidden />
                Scheduled for {formatDate(schedule.date)} at {schedule.time}
              </span>
            )}
            <button
              type="button"
              className={ghost}
              onClick={() =>
                toast("Test email sent to priya@fernhillroasters.com")
              }
            >
              Send test email
            </button>
            <button
              type="button"
              className={secondary}
              onClick={openSchedule}
              data-testid="schedule-campaign"
            >
              <CalendarClock className="size-4" aria-hidden /> Schedule
            </button>
            <button
              type="button"
              className={primary}
              disabled={checking}
              onClick={() => (v ? setVerifyOpen(true) : send())}
              data-testid="send-campaign"
            >
              <Send className="size-4" aria-hidden /> Send
            </button>
          </div>
        </div>

        <aside
          className="min-w-0 lg:sticky lg:top-24"
          aria-label="Email preview"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <Eye className="size-4 text-slate-400" aria-hidden /> Live preview
            </h2>
            <span className="text-xs text-slate-500">
              To {number(segment.count)} contacts
            </span>
          </div>
          <EmailPreview subject={subject} preview={preview} body={body} />
        </aside>
      </div>

      <Dialog
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Crown className="size-5 text-amber-500" aria-hidden /> Upgrade to
            Mailbird Pro
          </span>
        }
        className={dialog}
        testId="upsell-dialog"
      >
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pro picks the best send time for each subscriber and lifts open rates
          by up to 23%.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className={secondary}
            onClick={() => {
              setUpsellOpen(false);
              setScheduleOpen(true);
            }}
            data-testid="upsell-dismiss"
          >
            Maybe later
          </button>
          <button
            type="button"
            className={primary}
            onClick={() =>
              toast("Pro trial is not available in this workspace")
            }
          >
            Start free trial
          </button>
        </div>
      </Dialog>

      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule campaign"
        className={dialog}
        testId="schedule-dialog"
      >
        <form onSubmit={confirmSchedule} className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Sends to {segmentLabel(segment)} in your workspace time zone,
            Pacific Time.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelText}>Date</span>
              <input
                type="date"
                required
                value={date}
                
                onChange={(e) => setDate(e.target.value)}
                className={input}
                data-testid="schedule-date"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelText}>Time</span>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={input}
                data-testid="schedule-time"
              />
            </label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className={secondary}
              onClick={() => setScheduleOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primary}
              data-testid="confirm-schedule"
            >
              Schedule
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#15803D]" aria-hidden /> Verify
            it's you
          </span>
        }
        className={dialog}
        testId="verify-dialog"
      >
        <form onSubmit={verify} noValidate className="mt-3 flex flex-col gap-3">
          <p className="text-sm leading-6 text-slate-600">
            We sent a 6-digit code to your email. Enter it to send this
            campaign.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className={labelText}>Verification code</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setCodeError("");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-invalid={Boolean(codeError)}
              aria-describedby="code-hint code-error"
              className={cx(
                input,
                "h-11 text-center text-lg tracking-[0.4em] tabular-nums",
              )}
              data-testid="verify-code"
            />
          </label>
          <p id="code-hint" className="text-xs text-slate-500">
            Demo code: 123456
          </p>
          <p
            id="code-error"
            className="min-h-5 text-sm text-rose-600"
            data-testid="verify-error"
          >
            {codeError}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={secondary}
              onClick={() => setVerifyOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primary}
              data-testid="verify-submit"
            >
              Verify and send
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function Report({
  campaigns,
  contacts,
  duplicate,
  unschedule,
}: {
  campaigns: Campaign[];
  contacts: Contact[];
  duplicate: (c: Campaign) => string;
  unschedule: (id: string) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find((c) => c.id === id);
  useDocumentTitle(`${campaign?.name ?? "Campaign"} – Mailbird`);
  if (!campaign) return <Navigate to="/" replace />;
  const c = campaign;
  const segment = segmentById(c.segment);
  const isSent = c.status === "Sent";
  const hasResults = isSent && c.opens > 0;
  const delivered = c.recipients - c.bounces;
  const random = seeded(c.id);
  const hours = Array.from({ length: 24 }, (_, hour) =>
    isSent && c.opens
      ? Math.max(0.04, Math.exp(-hour / 4) * (0.6 + random() * 0.4))
      : 0,
  );
  const hoursTotal = hours.reduce((a, b) => a + b, 0) || 1;
  const peak = Math.max(...hours, 1e-6);
  const linkRows = links.map((url, index) => ({
    url,
    clicks: Math.round(c.clicks * [0.42, 0.24, 0.17, 0.1, 0.07][index]),
  }));
  const people = contacts.filter((p) => p.status === "Subscribed").slice(0, 6);
  const verbs = [
    "opened the email",
    "clicked a link",
    "opened the email",
    "clicked a link",
    "opened the email",
    "unsubscribed",
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex min-w-0 items-center gap-1.5">
            <li>
              <Link
                to="/"
                className={cx("rounded-sm hover:text-slate-900", focus)}
              >
                Campaigns
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li
              aria-current="page"
              className="truncate text-slate-700"
              title={c.name}
            >
              {c.name}
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {c.name}
              </h1>
              <Badge tone={statusTone[c.status]}>{c.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {isSent
                ? `Sent to ${segment.name} on ${formatDate(c.date)}${c.time ? ` at ${c.time}` : ""}`
                : c.status === "Scheduled"
                  ? `Scheduled for ${segment.name} on ${formatDate(c.date)} at ${c.time}`
                  : `Draft for ${segment.name}, edited ${edited(c.date)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.status === "Scheduled" && (
              <button
                type="button"
                className={secondary}
                onClick={() => unschedule(c.id)}
              >
                <X className="size-4" aria-hidden /> Cancel schedule
              </button>
            )}
            <button
              type="button"
              className={secondary}
              onClick={() => navigate(`/campaigns/${duplicate(c)}`)}
            >
              <Copy className="size-4" aria-hidden /> Duplicate
            </button>
          </div>
        </div>
      </header>

      {isSent && (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-slate-200 py-5 sm:grid-cols-3 xl:grid-cols-6">
          <Stat label="Recipients" value={number(c.recipients)} />
          <Stat
            label="Delivered"
            value={percent(delivered, c.recipients)}
            hint={`${number(c.bounces)} bounced`}
          />
          <Stat
            label="Open rate"
            value={percent(c.opens, c.recipients)}
            hint={`${number(c.opens)} unique opens`}
          />
          <Stat
            label="Click rate"
            value={percent(c.clicks, c.recipients)}
            hint={`${number(c.clicks)} unique clicks`}
          />
          <Stat
            label="Click-to-open"
            value={percent(c.clicks, c.opens)}
            hint="Clicks over opens"
          />
          <Stat
            label="Unsubscribes"
            value={number(c.unsubscribes)}
            hint={percent(c.unsubscribes, c.recipients)}
          />
        </dl>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex min-w-0 flex-col gap-8">
          {hasResults ? (
            <>
              <section aria-labelledby="opens-title">
                <div className="flex items-baseline justify-between">
                  <h2 id="opens-title" className="font-semibold text-slate-900">
                    Opens in the first 24 hours
                  </h2>
                  <span className="text-xs text-slate-500">
                    Hours after send
                  </span>
                </div>
                <div
                  className="mt-4 flex h-40 items-end gap-1 border-b border-slate-200"
                  role="img"
                  aria-label={`Opens peak in the first hour after sending, ${number(c.opens)} unique opens in total`}
                >
                  {hours.map((h, hour) => (
                    <div
                      key={`h${hour.toString()}`}
                      className="flex-1 rounded-t-sm bg-[#15803D]/80 hover:bg-[#15803D]"
                      style={{ height: `${(h / peak) * 100}%` }}
                      title={`Hour ${hour + 1}: ${number(Math.round((c.opens * h) / hoursTotal))} opens`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-slate-400">
                  <span>0</span>
                  <span>6</span>
                  <span>12</span>
                  <span>18</span>
                  <span>24</span>
                </div>
              </section>
              <section aria-labelledby="links-title" className={panel}>
                <h2
                  id="links-title"
                  className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900"
                >
                  Top links
                </h2>
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead className="text-xs text-slate-500">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left font-medium"
                        >
                          Link
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-right font-medium"
                        >
                          Clicks
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-right font-medium"
                        >
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkRows.map((row) => (
                        <tr key={row.url} className="border-t border-slate-100">
                          <td
                            className="max-w-64 truncate px-4 py-2.5 text-slate-700"
                            title={row.url}
                          >
                            {row.url}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {number(row.clicks)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                            {percent(row.clicks, c.clicks)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className={panel}>
              <EmptyState
                icon={<MailOpen className="size-5" aria-hidden />}
                title={
                  isSent
                    ? "Results are still coming in"
                    : "The report appears after sending"
                }
                body={
                  isSent
                    ? "Opens and clicks usually start within minutes of sending. Check back shortly."
                    : c.status === "Scheduled"
                      ? `Opens, clicks and unsubscribes show here once this campaign goes out on ${formatDate(c.date)}.`
                      : "This draft has not been sent yet. Opens, clicks and unsubscribes show here after it goes out."
                }
                action={
                  <Link to="/campaigns/new" className={secondary}>
                    <Plus className="size-4" aria-hidden /> New campaign
                  </Link>
                }
              />
            </section>
          )}

          <section aria-labelledby="facts-title">
            <h2 id="facts-title" className="font-semibold text-slate-900">
              Details
            </h2>
            <dl className="mt-3 grid gap-x-8 text-sm sm:grid-cols-2">
              {[
                ["Subject", c.subject],
                ["Preview text", c.preview || "None"],
                ["Audience", segmentLabel(segment)],
                ["From", "Fernhill Roasters <hello@fernhillroasters.com>"],
                ["Created by", c.author],
                ["Tracking", "Opens and clicks"],
              ].map(([term, detail]) => (
                <div
                  key={term}
                  className="flex justify-between gap-4 border-b border-slate-100 py-2.5"
                >
                  <dt className="shrink-0 text-slate-500">{term}</dt>
                  <dd
                    className="truncate text-right text-slate-800"
                    title={detail}
                  >
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          {hasResults && (
            <section aria-labelledby="activity-title">
              <h2 id="activity-title" className="font-semibold text-slate-900">
                Recent activity
              </h2>
              <ol className="mt-4 flex flex-col gap-4">
                {people.map((p, index) => {
                  const Icon =
                    verbs[index] === "unsubscribed"
                      ? UserMinus
                      : verbs[index] === "clicked a link"
                        ? MousePointerClick
                        : MailOpen;
                  return (
                    <li key={p.id} className="flex items-start gap-3 text-sm">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-slate-700">
                          <span className="font-medium text-slate-900">
                            {p.name}
                          </span>{" "}
                          {verbs[index]}
                        </p>
                        <p className="text-xs text-slate-500">{`${index * 7 + 3} min after send`}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          <section aria-labelledby="email-title">
            <h2 id="email-title" className="mb-3 font-semibold text-slate-900">
              Email
            </h2>
            <EmailPreview
              subject={c.subject}
              preview={c.preview}
              body={c.body}
              compact
            />
          </section>
        </div>
      </div>
    </div>
  );
}

type ContactKey = "name" | "status" | "added" | "open";

function Audience({
  contacts,
  addContact,
}: {
  contacts: Contact[];
  addContact: (c: Contact) => void;
}) {
  useDocumentTitle("Audience – Mailbird");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContactStatus | "All">("All");
  const [segment, setSegment] = useState("all");
  const [sort, onSort] = useSort<ContactKey>();
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => setPage(0), [query, status, segment, sort.key, sort.dir]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = contacts.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (segment === "all" || p.segments.includes(segment)) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)),
    );
    if (!sort.key) return list;
    const value = (p: Contact): string | number =>
      sort.key === "name"
        ? p.name.toLowerCase()
        : sort.key === "status"
          ? p.status
          : sort.key === "added"
            ? p.added
            : (p.openRate ?? -1);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) =>
      value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0,
    );
  }, [contacts, query, status, segment, sort]);

  const shown = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Audience"
        description="Your contacts and the segments you send to."
        actions={
          <button
            type="button"
            className={primary}
            onClick={() => setOpen(true)}
            data-testid="add-contact"
          >
            <UserPlus className="size-4" aria-hidden /> Add contact
          </button>
        }
      />

      <section aria-labelledby="segments-title">
        <h2 id="segments-title" className="font-semibold text-slate-900">
          Segments
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {segments.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={segment === s.id}
                onClick={() => setSegment(s.id)}
                className={cx(
                  "flex w-full flex-col rounded-xl border bg-white p-4 text-left hover:border-slate-300",
                  focus,
                  segment === s.id
                    ? "border-[#15803D] ring-1 ring-[#15803D]"
                    : "border-slate-200",
                )}
                data-testid={`segment-${s.id}`}
              >
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span className="truncate font-medium text-slate-900">
                    {s.name}
                  </span>
                  <span
                    className={cx(
                      "shrink-0 text-xs tabular-nums",
                      s.growth >= 0 ? "text-[#15803D]" : "text-rose-600",
                    )}
                  >
                    {s.growth >= 0 ? "+" : ""}
                    {s.growth}% this month
                  </span>
                </span>
                <span className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-950">
                  {number(s.count)}
                </span>
                <span
                  className="mt-1 line-clamp-1 text-xs text-slate-500"
                  title={s.description}
                >
                  {s.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={panel} aria-label="Contacts">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
          <h2 className="px-1 font-semibold text-slate-900">
            Contacts
            <span className="ml-2 text-sm font-normal text-slate-500">
              {segment === "all"
                ? "All subscribers"
                : segmentById(segment).name}
            </span>
          </h2>
          <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
              <span className="sr-only">Search contacts</span>
              <Search
                className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className={cx(input, "pl-9")}
              />
            </label>
            <label className="sr-only" htmlFor="contact-status">
              Status
            </label>
            <select
              id="contact-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ContactStatus | "All")
              }
              className={inlineSelect}
            >
              <option value="All">Any status</option>
              <option>Subscribed</option>
              <option>Unsubscribed</option>
              <option>Bounced</option>
            </select>
          </div>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <SortHeader
                  label="Contact"
                  column="name"
                  sort={sort}
                  onSort={onSort}
                />
                <SortHeader
                  label="Status"
                  column="status"
                  sort={sort}
                  onSort={onSort}
                />
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Location
                </th>
                <SortHeader
                  label="Added"
                  column="added"
                  sort={sort}
                  onSort={onSort}
                />
                <SortHeader
                  label="Open rate"
                  column="open"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody data-testid="contact-list">
              {shown.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-100 first:border-t-0 hover:bg-slate-50/70"
                >
                  <td className="max-w-80 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size={30} />
                      <div className="min-w-0">
                        <p
                          className="truncate font-medium text-slate-900"
                          title={p.name}
                        >
                          {p.name}
                        </p>
                        <p className="truncate text-slate-500" title={p.email}>
                          {p.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={contactTone[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                    {p.location}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 tabular-nums">
                    {relativeTime(p.added)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {p.openRate === null ? "No sends yet" : `${p.openRate}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" aria-hidden />}
            title="No contacts found"
            body="No contacts match this search in the selected segment."
            action={
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setQuery("");
                  setStatus("All");
                  setSegment("all");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
          />
        )}
      </section>

      <AddContactDialog
        open={open}
        onClose={() => setOpen(false)}
        existing={contacts}
        onAdd={(c) => {
          addContact(c);
          setOpen(false);
        }}
      />
    </div>
  );
}

function AddContactDialog({
  open,
  onClose,
  existing,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  existing: Contact[];
  onAdd: (c: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState("newsletter");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: { name?: string; email?: string } = {};
    if (!name.trim()) next.name = "Enter the contact's name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Enter a valid email address.";
    else if (existing.some((c) => c.email === email.trim().toLowerCase()))
      next.email = "This email is already in your audience.";
    setErrors(next);
    if (next.name || next.email) return;
    onAdd({
      id: `p-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      location: "Unknown",
      status: "Subscribed",
      segments: [segment],
      added: daysFromToday(0),
      openRate: null,
    });
    setName("");
    setEmail("");
    setErrors({});
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add contact"
      className={dialog}
      testId="add-contact-dialog"
    >
      <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={labelText}>Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="contact-name-error"
            className={input}
            autoComplete="off"
          />
          {errors.name && (
            <span id="contact-name-error" className="text-sm text-rose-600">
              {errors.name}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelText}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="contact-email-error"
            className={input}
            autoComplete="off"
          />
          {errors.email && (
            <span id="contact-email-error" className="text-sm text-rose-600">
              {errors.email}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelText}>Add to segment</span>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className={input}
          >
            {segments
              .filter((s) => s.id !== "all")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className={secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={primary}
            disabled={!name.trim() && !email.trim()}
          >
            Add contact
          </button>
        </div>
      </form>
    </Dialog>
  );
}

const defaults = {
  fromName: "Fernhill Roasters",
  replyTo: "hello@fernhillroasters.com",
  footer: "Fernhill Roasters, 14 Mill Lane, Portland, OR 97205",
  sendReport: true,
  weeklyDigest: false,
  bounceAlert: true,
};

const toggles: {
  key: "sendReport" | "weeklyDigest" | "bounceAlert";
  label: string;
  hint: string;
}[] = [
  {
    key: "sendReport",
    label: "Campaign reports",
    hint: "Email me a summary 24 hours after each send.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    hint: "A Monday roundup of audience growth and engagement.",
  },
  {
    key: "bounceAlert",
    label: "Bounce alerts",
    hint: "Tell me when a campaign's bounce rate goes above 2%.",
  },
];

const domainRecords: [string, string, "Verified" | "Pending", number][] = [
  ["SPF", "fernhillroasters.com", "Verified", -1],
  ["DKIM", "mb1._domainkey", "Verified", -3],
  ["DMARC", "_dmarc", "Verified", -3],
  ["Return path", "bounce.fernhillroasters.com", "Pending", 0],
];

function SettingsPage({ toast }: { toast: (m: string) => void }) {
  useDocumentTitle("Settings – Mailbird");
  const [saved, setSaved] = useState(defaults);
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(saved) !== JSON.stringify(form);

  function save(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.replyTo.trim())) {
      setError("Enter a valid reply-to address.");
      return;
    }
    setError("");
    setSaved(form);
    toast("Changes saved");
  }

  return (
    <form onSubmit={save} noValidate className="flex max-w-4xl flex-col gap-10">
      <PageHeader
        title="Settings"
        description="Sender details, sending domain and notifications for this workspace."
        actions={
          <button
            type="submit"
            className={primary}
            disabled={!dirty}
            data-testid="save-settings"
          >
            Save changes
          </button>
        }
      />

      <section
        className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]"
        aria-labelledby="sender-title"
      >
        <div>
          <h2 id="sender-title" className="font-semibold text-slate-900">
            Sender profile
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            How your emails appear in the inbox.
          </p>
        </div>
        <div className={cx(panel, "flex flex-col gap-5 p-5")}>
          <label className="flex flex-col gap-1.5">
            <span className={labelText}>From name</span>
            <input
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelText}>Reply-to address</span>
            <input
              type="email"
              value={form.replyTo}
              onChange={(e) => {
                setForm({ ...form, replyTo: e.target.value });
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby="reply-error"
              className={input}
            />
            {error && (
              <span id="reply-error" className="text-sm text-rose-600">
                {error}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelText}>Footer address</span>
            <input
              value={form.footer}
              onChange={(e) => setForm({ ...form, footer: e.target.value })}
              className={input}
            />
            <span className="text-xs text-slate-500">
              Anti-spam laws require a postal address in every email.
            </span>
          </label>
        </div>
      </section>

      <section
        className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]"
        aria-labelledby="domain-title"
      >
        <div>
          <h2 id="domain-title" className="font-semibold text-slate-900">
            Sending domain
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            DNS records that prove you own fernhillroasters.com.
          </p>
        </div>
        <div className={cx(panel, "overflow-x-auto")}>
          <table className="w-full min-w-[460px] text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">
                  Record
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">
                  Host
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Checked
                </th>
              </tr>
            </thead>
            <tbody>
              {domainRecords.map(([record, host, state, offset]) => (
                <tr key={record} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {record}
                  </td>
                  <td
                    className="max-w-52 truncate px-4 py-2.5 font-mono text-xs text-slate-600"
                    title={host}
                  >
                    {host}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={state === "Verified" ? "success" : "warning"}>
                      {state}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500">
                    {relativeTime(daysFromToday(offset))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]"
        aria-labelledby="notify-title"
      >
        <div>
          <h2 id="notify-title" className="font-semibold text-slate-900">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Emails we send to you, not your contacts.
          </p>
        </div>
        <div className={cx(panel, "divide-y divide-slate-100")}>
          {toggles.map((t) => (
            <label
              key={t.key}
              className="flex cursor-pointer items-start justify-between gap-4 p-4"
            >
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  {t.label}
                </span>
                <span className="block text-sm text-slate-500">{t.hint}</span>
              </span>
              <input
                type="checkbox"
                checked={form[t.key]}
                onChange={(e) =>
                  setForm({ ...form, [t.key]: e.target.checked })
                }
                className={cx("mt-1 size-4 shrink-0 accent-[#15803D]", focus)}
              />
            </label>
          ))}
        </div>
      </section>
    </form>
  );
}

function NavItems({ campaignCount }: { campaignCount: number }) {
  const { pathname } = useLocation();
  const inCampaign =
    pathname.startsWith("/campaigns/") && pathname !== "/campaigns/new";
  const item = ({ isActive }: { isActive: boolean }) =>
    cx(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
      focus,
      isActive
        ? "bg-[#15803D]/10 font-medium text-[#14532D]"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    );
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
      <NavLink
        to="/"
        end
        className={({ isActive }) => item({ isActive: isActive || inCampaign })}
      >
        <Send className="size-4" aria-hidden /> Campaigns
        <span className="ml-auto text-xs tabular-nums text-slate-400">
          {campaignCount}
        </span>
      </NavLink>
      <NavLink to="/audience" className={item}>
        <Users className="size-4" aria-hidden /> Audience
      </NavLink>
      <NavLink to="/campaigns/new" end className={item}>
        <FileText className="size-4" aria-hidden /> Write campaign
      </NavLink>
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200 pt-3">
        <NavLink to="/settings" className={item}>
          <Settings className="size-4" aria-hidden /> Settings
        </NavLink>
      </div>
    </nav>
  );
}

function Workspace({ toast }: { toast: (m: string) => void }) {
  return (
    <Menu
      label="Switch workspace"
      triggerClassName={cx(
        "flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left hover:bg-slate-50",
        focus,
      )}
      trigger={
        <>
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-900 text-xs font-semibold text-amber-50">
            FR
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">
              Fernhill Roasters
            </span>
            <span className="block text-xs text-slate-500">Growth plan</span>
          </span>
          <ChevronDown className="size-4 text-slate-400" aria-hidden />
        </>
      }
      items={[
        {
          label: "Fernhill Roasters",
          onSelect: () => toast("You are in Fernhill Roasters"),
        },
        {
          label: "Fernhill Wholesale",
          onSelect: () => toast("Switched to Fernhill Wholesale"),
        },
        {
          label: "Create workspace",
          onSelect: () => toast("Workspace creation opened"),
        },
      ]}
    />
  );
}

function Shell({
  children,
  toast,
  campaignCount,
}: {
  children: ReactNode;
  toast: (m: string) => void;
  campaignCount: number;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  return (
    <div className="flex min-h-screen bg-[#F8FAF8] text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-5 border-r border-slate-200 bg-white p-4 md:flex">
        <div className="flex items-center gap-2.5 px-1" data-testid="logo">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight text-slate-950">
            Mailbird
          </span>
        </div>
        <Workspace toast={toast} />
        <NavItems campaignCount={campaignCount} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <MobileNav label="Main navigation">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5 px-1">
                <BrandMark />
                <span className="text-lg font-semibold tracking-tight">
                  Mailbird
                </span>
              </div>
              <Workspace toast={toast} />
              <NavItems campaignCount={campaignCount} />
            </div>
          </MobileNav>
          <form
            role="search"
            className="relative min-w-0 max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                search.trim()
                  ? `/?q=${encodeURIComponent(search.trim())}`
                  : "/",
              );
            }}
          >
            <label htmlFor="global-search" className="sr-only">
              Search campaigns
            </label>
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400"
              aria-hidden
            />
            <input
              id="global-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns"
              className={cx(
                input,
                "border-slate-200 bg-slate-50 pl-9 shadow-none",
              )}
              data-testid="global-search"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
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
              triggerClassName="text-slate-500 hover:text-slate-900"
            />
            <div className="ml-2">
              <UserMenu
                name="Priya Raman"
                email="priya@fernhillroasters.com"
                items={["Profile", "Workspace settings"]}
                onSelect={(item) =>
                  item === "Sign out"
                    ? toast("Signed out of Mailbird")
                    : navigate("/settings")
                }
              />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [campaigns, setCampaigns] = useState(seedCampaigns);
  const [contacts, setContacts] = useState(seedContacts);
  const [whatsNew, setWhatsNew] = useState(v);
  const [cookies, setCookies] = useState(v);
  const [toasts, toast] = useToasts("bg-slate-900 text-white");

  const add = (c: Campaign) => setCampaigns((current) => [c, ...current]);
  const duplicate = (c: Campaign) => {
    const id = `c-${Date.now()}`;
    add({
      ...c,
      id,
      name: `${c.name} (copy)`,
      status: "Draft",
      date: daysFromToday(0),
      time: "",
      recipients: 0,
      opens: 0,
      clicks: 0,
      unsubscribes: 0,
      bounces: 0,
    });
    toast("Campaign duplicated");
    return id;
  };
  const unschedule = (id: string) => {
    setCampaigns((current) =>
      current.map((c) =>
        c.id === id ? { ...c, status: "Draft", time: "" } : c,
      ),
    );
    toast("Schedule canceled");
  };
  const addContact = (c: Contact) => {
    setContacts((current) => [c, ...current]);
    toast("Contact added");
  };

  return (
    <HashRouter>
      <div
        style={{ fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif" }}
      >
        <Shell
          toast={toast}
          campaignCount={campaigns.length}
        >
          <Routes>
            <Route
              index
              element={<CampaignList v={v} campaigns={campaigns} />}
            />
            <Route
              path="campaigns/new"
              element={<Editor v={v} add={add} toast={toast} />}
            />
            <Route
              path="campaigns/:id"
              element={
                <Report
                  campaigns={campaigns}
                  contacts={contacts}
                  duplicate={duplicate}
                  unschedule={unschedule}
                />
              }
            />
            <Route
              path="audience"
              element={<Audience contacts={contacts} addContact={addContact} />}
            />
            <Route path="settings" element={<SettingsPage toast={toast} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>

        <Dialog
          open={whatsNew}
          onClose={() => setWhatsNew(false)}
          title={
            <span className="flex items-center gap-2">
              <Gift className="size-5 text-[#15803D]" aria-hidden /> What's new
              in Mailbird
            </span>
          }
          className={dialog}
          testId="whats-new-dialog"
        >
          <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
            {[
              "AI subject line suggestions",
              "Send-time optimization for Pro workspaces",
              "Two-step verification before every send",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-[#15803D]"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className={primary}
              onClick={() => setWhatsNew(false)}
              data-testid="whats-new-dismiss"
            >
              Got it
            </button>
          </div>
        </Dialog>

        {cookies && (
          <section
            aria-label="Cookie consent"
            className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
            data-testid="cookie-banner"
          >
            <p className="flex items-center gap-3 text-sm text-slate-700">
              <Cookie className="size-5 shrink-0 text-amber-700" aria-hidden />
              We use cookies to improve Mailbird and measure campaign
              performance.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={secondary}
                onClick={() => setCookies(false)}
                data-testid="cookie-reject"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                className={primary}
                onClick={() => setCookies(false)}
                data-testid="cookie-accept"
              >
                Accept
              </button>
            </div>
          </section>
        )}
        {toasts}
      </div>
    </HashRouter>
  );
}
