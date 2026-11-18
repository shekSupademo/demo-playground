import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, CreditCard, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Drawer,
  Empty,
  Input,
  Modal,
  PageHeader,
  Panel,
} from "../components/ui";
import { isoDay } from "../data/seed";
import { BILL_COLUMNS, type Bill, type BillStatus } from "../data/types";
import { cx, money, shortDate } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

type Pending = { bill: Bill; action: "paid" | "scheduled" };
const statusLabel = (s: BillStatus) =>
  BILL_COLUMNS.find((c) => c.id === s)?.label ?? s;
const statusTone = {
  inbox: "blue",
  approved: "amber",
  scheduled: "gray",
  paid: "green",
} as const;
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function Bills() {
  const { bills, accounts } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [vendor, setVendor] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const today = isoDay(new Date());
  const operating = accounts.find((a) => a.id === "acc_ops");

  const vendors = useMemo(() => {
    const byVendor = new Map<string, Bill[]>();
    for (const b of bills)
      byVendor.set(b.vendor, [...(byVendor.get(b.vendor) ?? []), b]);
    return [...byVendor.entries()]
      .map(([name, list]) => {
        const open = list.filter((b) => b.status !== "paid");
        const nextDue = open.map((b) => b.dueDate).sort()[0];
        return {
          name,
          list,
          open,
          outstanding: open.reduce((s, b) => s + b.amount, 0),
          nextDue,
        };
      })
      .sort(
        (a, b) =>
          (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999") ||
          a.name.localeCompare(b.name),
      );
  }, [bills]);
  const shown = vendors.filter((v) =>
    v.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selected = vendors.find((v) => v.name === vendor);
  const open = bills.filter((b) => b.status !== "paid");
  const weekAhead = isoDay(new Date(Date.now() + 7 * 86_400_000));
  const sum = (list: Bill[]) => list.reduce((s, b) => s + b.amount, 0);
  const overdueBills = open.filter((b) => b.dueDate < today);
  const dueSoon = open.filter((b) => b.dueDate >= today && b.dueDate <= weekAhead);
  const stats = [
    { label: "Outstanding", value: money(sum(open)), note: `${open.length} open bills`, icon: Wallet, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300" },
    { label: "Overdue", value: money(sum(overdueBills)), note: `${overdueBills.length} past due`, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300" },
    { label: "Due in 7 days", value: money(sum(dueSoon)), note: `${dueSoon.length} coming up`, icon: CalendarClock, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300" },
    { label: "Paid", value: money(sum(bills.filter((b) => b.status === "paid"))), note: "Debited from Operating", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300" },
  ];

  const confirm = () => {
    if (!pending) return;
    const { bill, action } = pending;
    dispatch({ type: "bill/move", id: bill.id, status: action });
    toast(
      action === "paid"
        ? `Paid ${money(bill.amount)} to ${bill.vendor}`
        : `${bill.vendor} scheduled for ${shortDate(bill.dueDate)}`,
    );
    setPending(null);
  };
  const short =
    pending?.action === "paid" &&
    (operating?.balance ?? 0) < pending.bill.amount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        subtitle="Pick a vendor to review their bills, then pay now or schedule each one from Operating."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="bill-stats">
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="tabular truncate text-lg font-semibold">{value}</p>
              <p className="text-xs text-zinc-500">{note}</p>
            </div>
          </div>
        ))}
      </div>
      <Panel
        padded={false}
        title="Vendors"
        action={
          <label className="relative block w-56">
            <Search
              className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-400"
              aria-hidden
            />
            <Input
              aria-label="Search vendors"
              placeholder="Search vendors"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
              data-testid="vendor-search"
            />
          </label>
        }
      >
        {shown.length === 0 ? (
          <Empty title="No vendors match" body="Try a different name." />
        ) : (
          <ul
            className="divide-y divide-zinc-100 dark:divide-zinc-800"
            data-testid="vendor-list"
          >
            {shown.map((v) => (
              <li key={v.name}>
                <button
                  type="button"
                  onClick={() => setVendor(v.name)}
                  data-testid="vendor-row"
                  aria-label={`Review ${v.name} bills`}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    aria-hidden
                  >
                    {initials(v.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {v.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {v.open.length === 0
                        ? "All bills paid"
                        : `${v.open.length} open ${v.open.length === 1 ? "bill" : "bills"}`}
                    </span>
                  </span>
                  {v.nextDue &&
                    (v.nextDue < today ? (
                      <Badge tone="red">Overdue</Badge>
                    ) : (
                      <Badge>Next due {shortDate(v.nextDue)}</Badge>
                    ))}
                  <span className="tabular w-28 text-right text-sm font-semibold">
                    {money(v.outstanding)}
                  </span>
                  <ChevronRight className="size-4 text-zinc-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Drawer
        open={!!selected}
        onClose={() => !pending && setVendor(null)}
        title={selected?.name ?? ""}
        testId="vendor-drawer"
      >
        {selected && (
          <ul className="space-y-3">
            {selected.list.map((b) => (
              <li
                key={b.id}
                data-testid="vendor-bill"
                data-bill-id={b.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="tabular text-lg font-semibold">
                      {money(b.amount)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {b.invoiceRef} · {b.category} ·{" "}
                      {b.status === "paid"
                        ? "Settled"
                        : b.dueDate < today
                          ? `Overdue since ${shortDate(b.dueDate)}`
                          : `Due ${shortDate(b.dueDate)}`}
                    </p>
                  </div>
                  <Badge tone={statusTone[b.status]}>
                    {statusLabel(b.status)}
                  </Badge>
                </div>
                {b.status !== "paid" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setPending({ bill: b, action: "paid" })}
                      data-testid="bill-pay-now"
                    >
                      <CreditCard className="size-3.5" /> Pay now
                    </Button>
                    {b.status !== "scheduled" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setPending({ bill: b, action: "scheduled" })
                        }
                        data-testid="bill-schedule"
                      >
                        <CalendarClock className="size-3.5" /> Schedule
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={
          pending?.action === "paid" ? "Confirm payment" : "Confirm schedule"
        }
        testId="bill-confirm"
        footer={
          <>
            <Button onClick={() => setPending(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={short}
              onClick={confirm}
              data-testid="bill-confirm-submit"
            >
              {pending?.action === "paid"
                ? `Pay ${money(pending.bill.amount)}`
                : `Schedule for ${pending ? shortDate(pending.bill.dueDate) : ""}`}
            </Button>
          </>
        }
      >
        {pending && (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-zinc-500">Vendor</dt>
            <dd className="text-right font-medium">{pending.bill.vendor}</dd>
            <dt className="text-zinc-500">Invoice</dt>
            <dd className="text-right">{pending.bill.invoiceRef}</dd>
            <dt className="text-zinc-500">Amount</dt>
            <dd className="tabular text-right font-semibold">
              {money(pending.bill.amount)}
            </dd>
            <dt className="text-zinc-500">From</dt>
            <dd className="text-right">
              Operating ••{operating?.last4}{" "}
              <span className="text-zinc-500">
                ({money(operating?.balance ?? 0)})
              </span>
            </dd>
            <dt className="text-zinc-500">When</dt>
            <dd className="text-right">
              {pending.action === "paid"
                ? "Today"
                : `On the due date, ${shortDate(pending.bill.dueDate)}`}
            </dd>
            {short && (
              <dd className="col-span-2 text-xs text-rose-600">
                Operating doesn't have enough to cover this bill.
              </dd>
            )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
