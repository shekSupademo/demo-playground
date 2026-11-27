import { ChevronDown, ChevronsUpDown, ChevronUp, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "../../kit";
import { cx } from "../../ui";
import type { DealStage, Stage } from "./data";

export const t = {
  page: "bg-stone-50 text-stone-900",
  surface: "bg-white",
  border: "border-stone-200",
  muted: "text-stone-500",
  focus:
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600",
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 shadow-xs hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600",
  ghost:
    "inline-grid size-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600",
  input:
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-2 focus:outline-orange-500/30 aria-invalid:border-rose-500",
  panel: "rounded-2xl border border-stone-200 bg-white",
  dialog: "w-full max-w-md rounded-2xl bg-white p-6 text-stone-900 shadow-2xl",
};

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#EA580C" />
      <path
        d="M8 10.5h16M11 16h10M14 21.5h4"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const stageTone: Record<
  Stage | DealStage,
  Parameters<typeof Badge>[0]["tone"]
> = {
  Lead: "neutral",
  Qualified: "info",
  Discovery: "info",
  Proposal: "warning",
  Negotiation: "warning",
  "Closed won": "success",
  "Closed lost": "danger",
};

export function StageBadge({ stage }: { stage: Stage | DealStage }) {
  return <Badge tone={stageTone[stage]}>{stage}</Badge>;
}

export type Sort<K extends string> = { key: K; dir: "asc" | "desc" } | null;

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: K;
  sort: Sort<K>;
  onSort: (next: Sort<K>) => void;
  align?: "left" | "right";
  className?: string;
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
      className={cx("px-4 py-2.5 font-medium", className)}
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
          "inline-flex items-center gap-1 rounded hover:text-stone-900",
          align === "right" && "flex-row-reverse",
          t.focus,
        )}
      >
        {label}
        <Icon
          className={cx(
            "size-3.5",
            active ? "text-orange-600" : "text-stone-400",
          )}
          aria-hidden
        />
      </button>
    </th>
  );
}

export function compare(a: string | number, b: string | number) {
  return typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b));
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  children,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  children?: ReactNode;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-sm text-stone-500">
      <p className="tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
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
    <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-800">
      {label}
      {children}
      {error ? (
        <span className="text-xs font-normal text-rose-600">{error}</span>
      ) : (
        hint && (
          <span className="text-xs font-normal text-stone-500">{hint}</span>
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
}: {
  pending: boolean;
  disabled?: boolean;
  children: ReactNode;
  testId?: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      className={t.primary}
      disabled={pending || disabled}
      data-testid={testId}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> {pendingLabel}
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
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
