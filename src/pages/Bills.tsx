import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, GripVertical, MoveRight, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Dropdown } from "../components/Dropdown";
import { HoverMenu } from "../components/HoverMenu";
import { Badge, PageHeader } from "../components/ui";
import { isoDay } from "../data/seed";
import { BILL_COLUMNS, type Bill, type BillStatus } from "../data/types";
import { cx, money, shortDate } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

const next: Record<BillStatus, BillStatus | null> = { inbox: "approved", approved: "scheduled", scheduled: "paid", paid: null };
const columnLabel = (s: BillStatus) => BILL_COLUMNS.find((c) => c.id === s)?.label ?? s;
const accent: Record<BillStatus, { bar: string; dot: string }> = {
  inbox: { bar: "border-t-sky-500", dot: "bg-sky-500" },
  approved: { bar: "border-t-violet-500", dot: "bg-violet-500" },
  scheduled: { bar: "border-t-amber-500", dot: "bg-amber-500" },
  paid: { bar: "border-t-emerald-500", dot: "bg-emerald-500" },
};
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function Bills() {
  const { bills } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ col: BillStatus; beforeId?: string } | null>(null);
  const [vendor, setVendor] = useState<string>("all");
  const today = isoDay(new Date());

  const vendors = useMemo(() => [...new Set(bills.map((b) => b.vendor))].sort(), [bills]);
  const visible = bills.filter((b) => vendor === "all" || b.vendor === vendor);
  const open = visible.filter((b) => b.status !== "paid");
  const weekAhead = isoDay(new Date(Date.now() + 7 * 86_400_000));
  const sum = (list: Bill[]) => list.reduce((s, b) => s + b.amount, 0);
  const overdueBills = open.filter((b) => b.dueDate < today);
  const dueSoon = open.filter((b) => b.dueDate >= today && b.dueDate <= weekAhead);
  const stats = [
    { label: "Outstanding", value: money(sum(open)), note: `${open.length} open bills`, icon: Wallet, tone: "text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-300" },
    { label: "Overdue", value: money(sum(overdueBills)), note: `${overdueBills.length} past due`, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300" },
    { label: "Due in 7 days", value: money(sum(dueSoon)), note: `${dueSoon.length} coming up`, icon: CalendarClock, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300" },
    { label: "Paid", value: money(sum(visible.filter((b) => b.status === "paid"))), note: "Debited from Operating", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300" },
  ];

  const move = (bill: Bill, status: BillStatus, beforeId?: string) => {
    if (bill.status === status && !beforeId) return;
    dispatch({ type: "bill/move", id: bill.id, status, beforeId });
    if (bill.status !== status) toast(status === "paid" ? `Paid ${money(bill.amount)} to ${bill.vendor}` : `${bill.vendor} moved to ${columnLabel(status)}`);
  };

  const drop = (col: BillStatus, beforeId?: string) => {
    const bill = bills.find((b) => b.id === dragId);
    setDragId(null);
    setOver(null);
    if (!bill || bill.id === beforeId) return;
    move(bill, col, beforeId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        subtitle="Drag bills across the board to approve, schedule and pay them. Paying a bill debits Operating."
        actions={
          <Dropdown
            className="w-56"
            label="Vendor filter"
            value={vendor}
            testId="bill-vendor-filter"
            options={[{ value: "all", label: "All vendors" }, ...vendors.map((v) => ({ value: v, label: v }))]}
            onChange={setVendor}
          />
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="bill-stats">
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
              <p className="tabular truncate text-lg font-semibold">{value}</p>
              <p className="text-xs text-stone-500">{note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="bill-board">
        {BILL_COLUMNS.map((col) => {
          const items = visible.filter((b) => b.status === col.id);
          const total = items.reduce((s, b) => s + b.amount, 0);
          const isOver = over?.col === col.id;
          return (
            <section
              key={col.id}
              aria-label={`${col.label} column`}
              data-testid={`bill-column-${col.id}`}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (over?.col !== col.id || over.beforeId) setOver({ col: col.id });
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(col.id, over?.col === col.id ? over.beforeId : undefined);
              }}
              className={cx("flex min-h-72 flex-col rounded-xl border border-t-4 bg-stone-50 p-3 transition-colors dark:bg-stone-900/60", isOver ? "border-teal-400 bg-teal-50/60 dark:bg-teal-950/40" : "border-stone-200 dark:border-stone-800", accent[col.id].bar)}
            >
              <header className="mb-3 flex items-baseline justify-between px-1">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span className={cx("size-2 rounded-full", accent[col.id].dot)} aria-hidden />
                    {col.label}
                    <span className="rounded-full bg-white px-1.5 text-xs font-medium text-stone-500 shadow-sm dark:bg-stone-800">{items.length}</span>
                  </h2>
                  <p className="text-xs text-stone-500">{col.help}</p>
                </div>
                <span className="tabular text-sm font-semibold text-stone-700 dark:text-stone-200">{money(total)}</span>
              </header>
              <ul className="flex flex-1 flex-col gap-2">
                {items.map((b) => {
                  const overdue = b.status !== "paid" && b.dueDate < today;
                  const n = next[b.status];
                  return (
                    <li
                      key={b.id}
                      draggable
                      data-testid="bill-card"
                      data-bill-id={b.id}
                      aria-label={`${b.vendor}, ${money(b.amount)}`}
                      onDragStart={(e) => {
                        setDragId(b.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", b.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      onDragOver={(e) => {
                        if (!dragId || dragId === b.id) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (over?.beforeId !== b.id) setOver({ col: col.id, beforeId: b.id });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        drop(col.id, b.id);
                      }}
                      className={cx(
                        "group cursor-grab rounded-lg border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing dark:border-stone-700 dark:bg-stone-900",
                        overdue && "border-l-4 border-l-rose-500",
                        dragId === b.id && "opacity-40",
                        over?.beforeId === b.id && "border-t-2 border-t-teal-500",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-2 size-4 shrink-0 text-stone-300 group-hover:text-stone-500" aria-hidden />
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300" aria-hidden>
                          {initials(b.vendor)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{b.vendor}</p>
                          <p className="text-xs text-stone-500">
                            {b.invoiceRef} · {b.category}
                          </p>
                        </div>
                        <HoverMenu
                          label={`Actions for ${b.vendor} bill`}
                          testId="bill-menu"
                          items={[
                            ...(n ? [{ label: `Move to ${columnLabel(n)}`, icon: <ArrowRight className="size-3.5" />, onSelect: () => move(b, n) }] : []),
                            {
                              label: "Move to…",
                              icon: <MoveRight className="size-3.5" />,
                              submenu: BILL_COLUMNS.filter((c) => c.id !== b.status).map((c) => ({ label: c.label, onSelect: () => move(b, c.id) })),
                            },
                          ]}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 whitespace-nowrap pl-6">
                        <span className="tabular text-base font-semibold">{money(b.amount)}</span>
                        {b.status === "paid" ? <Badge tone="green">Paid</Badge> : overdue ? <Badge tone="red">Overdue {shortDate(b.dueDate)}</Badge> : <Badge>Due {shortDate(b.dueDate)}</Badge>}
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 && <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-stone-300 p-6 text-center text-xs text-stone-400 dark:border-stone-700">Drop bills here</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
