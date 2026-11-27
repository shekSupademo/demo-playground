import {
  CalendarClock,
  CheckCircle2,
  Cookie,
  Crown,
  Gift,
  Loader2,
  Mail,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";

type Status = "Draft" | "Scheduled" | "Sent";
type Campaign = {
  id: string;
  name: string;
  subject: string;
  audience: string;
  status: Status;
  when: string;
  openRate: string;
};

const audiences = [
  "All subscribers (12,480)",
  "Newsletter readers (8,215)",
  "Trial users (1,932)",
  "Customers in EMEA (3,041)",
];

const seed: Campaign[] = [
  {
    id: "c1",
    name: "November product update",
    subject: "Five new things you can do in Mailbird",
    audience: audiences[0],
    status: "Sent",
    when: "Nov 18, 2026",
    openRate: "48.2%",
  },
  {
    id: "c2",
    name: "Black Friday early access",
    subject: "Your 30% code is inside",
    audience: audiences[3],
    status: "Scheduled",
    when: "Nov 27, 2026 · 09:00",
    openRate: "—",
  },
  {
    id: "c3",
    name: "Trial day 7 nudge",
    subject: "Halfway through your trial: here's what's next",
    audience: audiences[2],
    status: "Sent",
    when: "Nov 12, 2026",
    openRate: "39.7%",
  },
  {
    id: "c4",
    name: "December newsletter",
    subject: "Year in review",
    audience: audiences[1],
    status: "Draft",
    when: "Edited 2 days ago",
    openRate: "—",
  },
];

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
const dialog =
  "w-full max-w-md rounded-xl bg-white p-6 text-slate-900 shadow-xl";

const statusStyle: Record<Status, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Scheduled: "bg-amber-100 text-amber-800",
  Sent: "bg-emerald-100 text-emerald-800",
};

function CampaignList({ v, campaigns }: { v: boolean; campaigns: Campaign[] }) {
  const [loading, setLoading] = useState(v);

  useEffect(() => {
    if (!v) return;
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [v]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-slate-500">
            Write, schedule, and send emails to your audience.
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className={primary}
          data-testid="new-campaign"
        >
          <Plus className="size-4" aria-hidden /> New campaign
        </Link>
      </header>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Audience</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Open rate</th>
            </tr>
          </thead>
          {loading ? (
            <tbody data-testid="campaign-skeleton" aria-busy="true">
              {[0, 1, 2, 3].map((row) => (
                <tr key={row} className="border-t border-slate-100">
                  {[0, 1, 2, 3, 4].map((cell) => (
                    <td key={cell} className="px-4 py-4">
                      <div className="h-3 w-3/4 animate-shimmer rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody data-testid="campaign-list">
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-100"
                  data-testid={`campaign-${c.id}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-slate-500">{c.subject}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.audience}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        statusStyle[c.status],
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.when}</td>
                  <td className="px-4 py-3 text-slate-600">{c.openRate}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
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
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState(audiences[0]);
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState<string | null>(null);
  const [date, setDate] = useState("2026-12-01");
  const [time, setTime] = useState("09:00");
  const [checking, setChecking] = useState(v);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

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
    setSchedule(`${date} · ${time}`);
    setScheduleOpen(false);
    toast(`Scheduled for ${date} at ${time}`);
  }

  function send() {
    add({
      id: `c-${Date.now()}`,
      name: name.trim() || "Untitled campaign",
      subject: subject.trim() || "(no subject)",
      audience,
      status: schedule ? "Scheduled" : "Sent",
      when: schedule ?? "Just now",
      openRate: "—",
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
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <Link to="/" className="text-sm text-slate-500 hover:underline">
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-bold">New campaign</h1>
      </header>
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Campaign name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="December newsletter"
            className={input}
            data-testid="campaign-name"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Subject line
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's new this month"
            className={input}
            data-testid="campaign-subject"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Audience
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={input}
            data-testid="campaign-audience"
          >
            {audiences.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Hi {first_name},"
            className={input}
            data-testid="campaign-body"
          />
        </label>
      </section>
      <section
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        data-testid="deliverability"
        aria-live="polite"
      >
        {checking ? (
          <>
            <Loader2
              className="size-4 animate-spin text-orange-500"
              aria-hidden
            />
            Checking deliverability…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
            Deliverability looks good: SPF and DKIM pass, no spam triggers
            found.
          </>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {schedule && (
          <span
            className="text-sm text-slate-600"
            data-testid="schedule-summary"
          >
            Scheduled for {schedule}
          </span>
        )}
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

      <Dialog
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Crown className="size-5 text-orange-500" aria-hidden /> Upgrade to
            Mailbird Pro
          </span>
        }
        className={dialog}
        testId="upsell-dialog"
      >
        <p className="mt-2 text-sm text-slate-600">
          Pro picks the best send time for each subscriber and lifts open rates
          by up to 23%.
        </p>
        <div className="mt-5 flex justify-end gap-2">
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
        <form onSubmit={confirmSchedule} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={input}
              data-testid="schedule-date"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Time
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={input}
              data-testid="schedule-time"
            />
          </label>
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
            <ShieldCheck className="size-5 text-orange-500" aria-hidden />{" "}
            Verify it's you
          </span>
        }
        className={dialog}
        testId="verify-dialog"
      >
        <form onSubmit={verify} noValidate className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            We sent a 6-digit code to your email. Enter it to send this
            campaign.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Verification code
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
              className={cx(input, "tracking-[0.4em]")}
              data-testid="verify-code"
            />
          </label>
          <p id="code-hint" className="text-xs text-slate-500">
            Demo code: 123456
          </p>
          <p
            id="code-error"
            className="text-sm text-rose-600"
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

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [campaigns, setCampaigns] = useState(seed);
  const [whatsNew, setWhatsNew] = useState(v);
  const [cookies, setCookies] = useState(v);
  const [toasts, toast] = useToasts("bg-slate-900 text-white");

  const add = (c: Campaign) => setCampaigns((current) => [c, ...current]);

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
          <div
            className="mb-6 flex items-center gap-2 font-bold"
            data-testid="logo"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-orange-500 text-white">
              <Mail className="size-4" aria-hidden />
            </span>
            Mailbird
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  isActive
                    ? "bg-orange-50 font-medium text-orange-700"
                    : "text-slate-500 hover:text-slate-900",
                )
              }
            >
              <Send className="size-4" aria-hidden /> Campaigns
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Routes>
            <Route
              index
              element={<CampaignList v={v} campaigns={campaigns} />}
            />
            <Route
              path="campaigns/new"
              element={<Editor v={v} add={add} toast={toast} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <Dialog
        open={whatsNew}
        onClose={() => setWhatsNew(false)}
        title={
          <span className="flex items-center gap-2">
            <Gift className="size-5 text-orange-500" aria-hidden /> What's new
            in Mailbird
          </span>
        }
        className={dialog}
        testId="whats-new-dialog"
      >
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>AI subject line suggestions</li>
          <li>Send-time optimization for Pro workspaces</li>
          <li>Two-step verification before every send</li>
        </ul>
        <div className="mt-5 flex justify-end">
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
          className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 shadow-lg"
          data-testid="cookie-banner"
        >
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <Cookie className="size-5 text-orange-500" aria-hidden />
            We use cookies to improve Mailbird and measure campaign performance.
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
    </HashRouter>
  );
}
