import { ChevronDown, ChevronsUpDown, ChevronUp, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "../../kit";
import { cx } from "../../ui";
import type { Category, Fulfillment, Payment } from "./data";

export const t = {
  page: "bg-slate-50 text-slate-900",
  focus:
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
  ghost:
    "inline-grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
  input:
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/25 aria-invalid:border-rose-500",
  panel: "rounded-2xl border border-slate-200 bg-white",
  dialog: "w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl",
  drawer:
    "w-full max-w-md bg-white p-6 text-slate-900 shadow-2xl animate-drawer-in",
};

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0F766E" />
      <path
        d="M9.5 12.5h13l-1.2 11a1.5 1.5 0 0 1-1.5 1.3h-7.6a1.5 1.5 0 0 1-1.5-1.3z"
        fill="#5EEAD4"
      />
      <path
        d="M12.5 12.5a3.5 3.5 0 0 1 7 0"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const palettes = [
  ["#CCFBF1", "#0F766E"],
  ["#FDE68A", "#B45309"],
  ["#FBCFE8", "#BE185D"],
  ["#DBEAFE", "#1D4ED8"],
  ["#E7E5E4", "#57534E"],
  ["#DCFCE7", "#15803D"],
  ["#EDE9FE", "#6D28D9"],
  ["#FFEDD5", "#C2410C"],
];

function hash(value: string) {
  let n = 0;
  for (const char of value) n = (n * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(n);
}

const shapes: Record<Category, (fg: string) => ReactNode> = {
  Apparel: (fg) => (
    <path
      d="M24 14l-10 6 4 9 5-2v23h18V27l5 2 4-9-10-6c-1.5 3.5-4.5 5-8 5s-6.5-1.5-8-5z"
      fill={fg}
    />
  ),
  Home: (fg) => (
    <>
      <rect x="17" y="22" width="24" height="26" rx="5" fill={fg} />
      <path
        d="M41 28h3a6 6 0 0 1 0 12h-3"
        fill="none"
        stroke={fg}
        strokeWidth="4"
      />
      <path
        d="M24 12c-2 3 2 4 0 7M32 12c-2 3 2 4 0 7"
        fill="none"
        stroke={fg}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </>
  ),
  Beauty: (fg) => (
    <>
      <rect
        x="27"
        y="11"
        width="10"
        height="11"
        rx="5"
        fill={fg}
        opacity="0.55"
      />
      <rect x="28" y="21" width="8" height="7" fill={fg} />
      <rect x="22" y="28" width="20" height="24" rx="5" fill={fg} />
      <rect
        x="26"
        y="35"
        width="12"
        height="7"
        rx="1.5"
        fill="#fff"
        opacity="0.6"
      />
    </>
  ),
  Accessories: (fg) => (
    <>
      <path
        d="M24 27c0-9 16-9 16 0"
        fill="none"
        stroke={fg}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M15 26h34l-3.5 24a3 3 0 0 1-3 2.5h-21a3 3 0 0 1-3-2.5z"
        fill={fg}
      />
    </>
  ),
};

export function ProductArt({
  id,
  category,
  size,
  className,
}: {
  id: string;
  category: Category;
  size?: number;
  className?: string;
}) {
  const [bg, fg] = palettes[hash(id) % palettes.length];
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className={cx("shrink-0", className)}
      style={{ background: bg }}
    >
      {shapes[category](fg)}
    </svg>
  );
}

export function StatusBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? "success" : "neutral"}>
      {published ? "Published" : "Draft"}
    </Badge>
  );
}

const fulfillmentTone = {
  Unfulfilled: "warning",
  "Partially fulfilled": "info",
  Fulfilled: "success",
  Returned: "neutral",
} as const;
export function FulfillmentBadge({ value }: { value: Fulfillment }) {
  return <Badge tone={fulfillmentTone[value]}>{value}</Badge>;
}

const paymentTone = {
  Paid: "success",
  Pending: "warning",
  Refunded: "danger",
} as const;
export function PaymentBadge({ value }: { value: Payment }) {
  return <Badge tone={paymentTone[value]}>{value}</Badge>;
}

export type Sort<K extends string> = { key: K; dir: "asc" | "desc" } | null;

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: K;
  sort: Sort<K>;
  onSort: (next: Sort<K>) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey;
  const Icon = !active
    ? ChevronsUpDown
    : sort.dir === "asc"
      ? ChevronUp
      : ChevronDown;
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
        onClick={() =>
          onSort(
            !active
              ? { key: sortKey, dir: "asc" }
              : sort.dir === "asc"
                ? { key: sortKey, dir: "desc" }
                : null,
          )
        }
        className={cx(
          "inline-flex items-center gap-1 rounded hover:text-slate-900",
          align === "right" && "flex-row-reverse",
          t.focus,
        )}
      >
        {label}
        <Icon
          className={cx(
            "size-3.5",
            active ? "text-teal-700" : "text-slate-400",
          )}
          aria-hidden
        />
      </button>
    </th>
  );
}

export function sortBy<T, K extends string>(
  rows: T[],
  sort: Sort<K>,
  value: (row: T, key: K) => string | number,
) {
  if (!sort) return rows;
  const sorted = [...rows].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    return typeof x === "number" && typeof y === "number"
      ? x - y
      : String(x).localeCompare(String(y));
  });
  return sort.dir === "asc" ? sorted : sorted.reverse();
}

export function Pagination({
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
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-slate-500">
      <p className="tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={cx(t.secondary, "px-3 py-1.5")}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className={cx(t.secondary, "px-3 py-1.5")}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
      {label}
      {children}
      {error ? (
        <span className="text-xs font-normal text-rose-600">{error}</span>
      ) : (
        hint && (
          <span className="text-xs font-normal text-slate-500">{hint}</span>
        )
      )}
    </label>
  );
}

export function usePending() {
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = (done: () => void) => {
    setPending(true);
    timer.current = setTimeout(() => {
      setPending(false);
      done();
    }, 350);
  };
  return [pending, run] as const;
}

export function SubmitButton({
  pending,
  disabled,
  children,
  testId,
  pendingLabel,
  className,
}: {
  pending: boolean;
  disabled?: boolean;
  children: ReactNode;
  testId?: string;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={cx(t.primary, className)}
      disabled={pending || disabled}
      data-testid={testId}
    >
      {pending ? (
        <>
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden
          />{" "}
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function PageHeader({
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
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
