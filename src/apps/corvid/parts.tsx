import { ChevronRight, type LucideIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, useDocumentTitle } from "../../kit";
import { cx, Dialog } from "../../ui";
import type { Member } from "./data";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3046C5]";

export const t = {
  focus,
  page: "bg-[#F6F7F9] text-slate-900",
  muted: "text-slate-500",
  link: cx("font-medium text-[#3046C5] hover:underline", focus),
  primary: cx(
    "inline-flex items-center justify-center gap-2 rounded-md bg-[#3046C5] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#25389F] disabled:cursor-not-allowed disabled:opacity-50",
    focus,
  ),
  secondary: cx(
    "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50",
    focus,
  ),
  danger: cx(
    "inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50",
    focus,
  ),
  ghost: cx(
    "inline-grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
    focus,
  ),
  input:
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-[#3046C5] focus:outline-2 focus:outline-[#3046C5]/25 aria-invalid:border-rose-500",
  panel: "rounded-xl border border-slate-200 bg-white",
  dialog: "w-full max-w-md rounded-xl bg-white p-6 text-slate-900 shadow-2xl",
};

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#141B3D" />
      <path
        d="M9 21.5 16 9l7 12.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19" r="2.6" fill="#7D8CFF" />
    </svg>
  );
}

export type Crumb = { label: string; to?: string };

export function Page({
  crumbs,
  title,
  description,
  actions,
  children,
  meta,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const plain =
    typeof title === "string" ? title : (crumbs.at(-1)?.label ?? "Corvid");
  useDocumentTitle(`${plain} – Corvid`);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" data-testid="breadcrumbs">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight
                    className="size-3.5 text-slate-400"
                    aria-hidden
                  />
                )}
                {c.to ? (
                  <Link
                    to={c.to}
                    className={cx("rounded hover:text-slate-900", focus)}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-slate-700">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {description}
              </p>
            )}
            {meta && (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                {meta}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function LinkList({
  items,
}: {
  items: {
    to: string;
    label: string;
    description: string;
    Icon?: LucideIcon;
    testId?: string;
    aside?: ReactNode;
  }[];
}) {
  return (
    <ul className={cx(t.panel, "divide-y divide-slate-100 overflow-hidden")}>
      {items.map(({ to, label, description, Icon, testId, aside }) => (
        <li key={to}>
          <Link
            to={to}
            data-testid={testId}
            className={cx(
              "flex items-center gap-4 px-5 py-4 hover:bg-slate-50",
              focus,
              "focus-visible:-outline-offset-2",
            )}
          >
            {Icon && (
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#EEF0FC] text-[#3046C5]">
                <Icon className="size-4.5" aria-hidden />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{label}</span>
              <span
                className="block truncate text-sm text-slate-500"
                title={description}
              >
                {description}
              </span>
            </span>
            {aside && (
              <span className="hidden text-sm text-slate-500 tabular-nums sm:block">
                {aside}
              </span>
            )}
            <ChevronRight
              className="size-4 shrink-0 text-slate-400"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function useTab<T extends string>(tabs: readonly T[]) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const current = tabs.find((tab) => tab === raw) ?? tabs[0];
  return [
    current,
    (tab: T) => setParams(tab === tabs[0] ? {} : { tab }),
  ] as const;
}

export function Tabs<T extends string>({
  tabs,
  current,
  onChange,
  labels,
}: {
  tabs: readonly T[];
  current: T;
  onChange: (tab: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div
      role="tablist"
      className="-mt-2 flex gap-6 overflow-x-auto border-b border-slate-200"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === current}
          data-testid={`tab-${tab}`}
          onClick={() => onChange(tab)}
          className={cx(
            "-mb-px shrink-0 border-b-2 pb-2.5 text-sm font-medium",
            focus,
            tab === current
              ? "border-[#3046C5] text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl
      className={cx(
        t.panel,
        "grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TwoFactorBadge({ value }: { value: Member["twoFactor"] }) {
  return (
    <Badge tone={value === "Not enrolled" ? "warning" : "success"}>
      {value}
    </Badge>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  body,
  confirm,
  onConfirm,
  testId,
  typeToConfirm,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  confirm: string;
  onConfirm: () => void;
  testId: string;
  typeToConfirm?: string;
  danger?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const ready = !typeToConfirm || typed === typeToConfirm;
  const close = () => {
    setTyped("");
    onClose();
  };
  return (
    <Dialog open={open} onClose={close} title={title} className={t.dialog}>
      <div className="mt-2 text-sm text-slate-600">{body}</div>
      {typeToConfirm && (
        <label className="mt-4 block text-sm">
          <span className="font-medium">
            Type <span className="font-semibold">{typeToConfirm}</span> to
            confirm
          </span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            data-testid="confirm-key-name"
          />
        </label>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={t.secondary} onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? t.danger : t.primary}
          disabled={!ready}
          data-testid={testId}
          onClick={() => {
            onConfirm();
            close();
          }}
        >
          {confirm}
        </button>
      </div>
    </Dialog>
  );
}

export function Table({
  head,
  children,
}: {
  head: { label: string; right?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className={cx(t.panel, "relative overflow-x-auto")}>
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th
                key={`${h.label}-${i}`}
                scope="col"
                className={cx(
                  "px-5 py-2.5 font-medium",
                  h.right && "text-right",
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function usage(used: number, limit: number) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return {
    pct,
    tone:
      pct >= 90 ? "bg-rose-500" : pct >= 75 ? "bg-amber-500" : "bg-[#3046C5]",
  };
}

export function UsageBar({ used, limit }: { used: number; limit: number }) {
  const { pct, tone } = usage(used, limit);
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Storage used"
    >
      <div
        className={cx("h-full rounded-full", tone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
