import { ArrowRight, GripVertical, MoveRight } from "lucide-react";
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
              className={cx("flex min-h-72 flex-col rounded-xl border bg-zinc-100/60 p-3 transition-colors dark:bg-zinc-900/60", isOver ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40" : "border-zinc-200 dark:border-zinc-800")}
            >
              <header className="mb-3 flex items-baseline justify-between px-1">
                <div>
                  <h2 className="text-sm font-semibold">
                    {col.label} <span className="ml-1 text-zinc-400">{items.length}</span>
                  </h2>
                  <p className="text-xs text-zinc-500">{col.help}</p>
                </div>
                <span className="tabular text-xs font-medium text-zinc-500">{money(total)}</span>
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
                        "group cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900",
                        dragId === b.id && "opacity-40",
                        over?.beforeId === b.id && "border-t-2 border-t-indigo-500",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{b.vendor}</p>
                          <p className="text-xs text-zinc-500">
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
                      <div className="mt-2 flex items-center justify-between pl-6">
                        <span className="tabular text-sm font-semibold">{money(b.amount)}</span>
                        {b.status === "paid" ? <Badge tone="green">Paid</Badge> : overdue ? <Badge tone="red">Overdue {shortDate(b.dueDate)}</Badge> : <Badge>Due {shortDate(b.dueDate)}</Badge>}
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 && <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-400 dark:border-zinc-700">Drop bills here</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
