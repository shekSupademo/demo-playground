import { ArrowUpRight, CalendarClock, Plus, Send, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Empty, Input, PageHeader, Panel, Tabs } from "../components/ui";
import { isoDay } from "../data/seed";
import { longDate, money } from "../lib/format";
import { useStore } from "../state/store";
import { useUI } from "../state/ui";

export function Payments() {
  const { recipients, transactions, accounts } = useStore();
  const ui = useUI();
  const [tab, setTab] = useState<"upcoming" | "recent">("upcoming");
  const [q, setQ] = useState("");
  const today = isoDay(new Date());

  const outgoing = transactions.filter((t) => t.amount < 0 && (t.method === "ach" || t.method === "wire"));
  const upcoming = outgoing.filter((t) => t.status === "pending" || t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const recent = outgoing.filter((t) => t.status !== "pending" && t.date <= today).slice(0, 30);
  const list = tab === "upcoming" ? upcoming : recent;

  const paidTo = useMemo(() => {
    const m = new Map<string, { total: number; last?: string }>();
    for (const t of outgoing) {
      const row = m.get(t.counterparty) ?? { total: 0 };
      row.total -= t.amount;
      if (!row.last || t.date > row.last) row.last = t.date;
      m.set(t.counterparty, row);
    }
    return m;
  }, [outgoing]);

  const monthAgo = isoDay(new Date(Date.now() - 30 * 86_400_000));
  const stats = [
    { label: "Scheduled", value: money(-upcoming.reduce((s, t) => s + t.amount, 0)), hint: `${upcoming.length} payments`, icon: CalendarClock, tone: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300" },
    { label: "Sent in 30 days", value: money(-recent.filter((t) => t.date >= monthAgo).reduce((s, t) => s + t.amount, 0)), hint: "ACH and wire", icon: ArrowUpRight, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300" },
    { label: "Recipients", value: String(recipients.length), hint: `${paidTo.size} paid before`, icon: Users, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" },
  ];

  const filteredRecipients = recipients.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Pay vendors and contractors by ACH or wire."
        actions={
          <Button variant="primary" onClick={() => ui.openSend()} data-testid="payments-send">
            <Send className="size-4" /> Send money
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3" data-testid="payment-stats">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className={`flex size-10 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              <p className="tabular truncate text-lg font-semibold tracking-tight">{value}</p>
              <p className="text-[11px] text-zinc-400">{hint}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Payments" className="lg:col-span-2" padded={false} action={<Tabs value={tab} onChange={setTab} options={[{ value: "upcoming", label: "Upcoming", count: upcoming.length }, { value: "recent", label: "Recent" }]} />}>
          {list.length === 0 ? (
            <Empty title={tab === "upcoming" ? "No upcoming payments" : "No payments yet"} body="Payments you send or schedule show up here." action={<Button onClick={() => ui.openSend()}>Send money</Button>} />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800" data-testid="payment-list">
              {list.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={t.counterparty} />
                    <div className="min-w-0">
                    <p className="font-medium">{t.counterparty}</p>
                    <p className="text-xs text-zinc-500">
                      {t.method.toUpperCase()} · from {accounts.find((a) => a.id === t.accountId)?.name} · {t.date > today ? `scheduled ${longDate(t.date)}` : longDate(t.date)}
                    </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={t.status === "pending" ? "amber" : t.status === "failed" ? "red" : "green"}>{t.status === "posted" ? "sent" : t.status}</Badge>
                    <span className="tabular w-24 text-right font-semibold">{money(-t.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recipients" padded={false} action={<Button size="sm" variant="ghost" onClick={() => ui.openSend()}><Plus className="size-3.5" /> New</Button>}>
          <div className="p-3">
            <Input placeholder="Search recipients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search recipients" />
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800" data-testid="recipients">
            {filteredRecipients.map((r) => {
              const paid = paidTo.get(r.name);
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <Avatar name={r.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {r.bank} ••{r.last4} · {paid ? `${money(paid.total)} paid` : "Never paid"}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => ui.openSend(r.id)} aria-label={`Pay ${r.name}`}>
                    Pay
                  </Button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
