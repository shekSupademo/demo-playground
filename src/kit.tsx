import { Bell, Check, LogOut, Menu as MenuIcon } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cx, Dialog } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function daysFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDay(d);
}

export function formatDate(value: string) {
  return parseDay(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeTime(value: string) {
  const now = new Date();
  const date = value.length > 10 ? new Date(value) : parseDay(value);
  if (value.length > 10) {
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (minutes >= 0 && minutes < 1) return "Just now";
    if (minutes >= 0 && minutes < 60) return `${minutes} min ago`;
    if (minutes >= 0 && minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  }
  const days = Math.round((parseDay(isoDay(date)).getTime() - parseDay(isoDay(now)).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === -1) return "Yesterday";
  if (days === 1) return "Tomorrow";
  if (days < 0 && days > -7) return `${-days} days ago`;
  if (days > 0 && days < 7) return `In ${days} days`;
  return formatDate(isoDay(date));
}

export function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

const avatarColors = [
  "#0f766e",
  "#7c3aed",
  "#c2410c",
  "#0369a1",
  "#be123c",
  "#4d7c0f",
  "#a16207",
  "#4338ca",
];

export function avatarColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: avatarColor(name),
      }}
    >
      {initials(name)}
    </span>
  );
}

const badgeTones = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-500/15",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-zinc-100 text-zinc-500">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Popover({
  label,
  trigger,
  children,
  triggerClassName,
  panelClassName,
  testId,
}: {
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  testId?: string;
}) {
  const id = useId();
  const anchor = `--pop-${id.replace(/[^a-z0-9]/gi, "")}`;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        popoverTarget={id}
        data-testid={testId}
        className={triggerClassName}
        style={{ anchorName: anchor } as CSSProperties}
      >
        {trigger}
      </button>
      <div
        ref={ref}
        id={id}
        popover="auto"
        style={
          {
            positionAnchor: anchor,
            positionArea: "bottom span-left",
            margin: 6,
          } as CSSProperties
        }
        className={cx(
          "rounded-xl border border-black/10 bg-white text-sm text-zinc-800 shadow-xl",
          panelClassName,
        )}
      >
        {children(() => ref.current?.hidePopover?.())}
      </div>
    </>
  );
}

export type Notification = {
  id: string;
  title: string;
  time: string;
  unread: boolean;
};

export function NotificationsMenu({
  items,
  triggerClassName,
}: {
  items: Notification[];
  triggerClassName?: string;
}) {
  const [list, setList] = useState(items);
  const unread = list.filter((item) => item.unread).length;
  return (
    <Popover
      label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      testId="notifications"
      triggerClassName={cx(
        "relative grid size-9 place-items-center rounded-lg hover:bg-black/5",
        triggerClassName,
      )}
      panelClassName="w-80"
      trigger={
        <>
          <Bell className="size-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </>
      }
    >
      {() => (
        <>
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="font-semibold">Notifications</h2>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() =>
                setList((current) =>
                  current.map((item) => ({ ...item, unread: false })),
                )
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
            >
              <Check className="size-3.5" aria-hidden /> Mark all as read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {list.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-2.5">
                <span
                  className={cx(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.unread ? "bg-rose-500" : "bg-transparent",
                  )}
                />
                <div>
                  <p className={cx(item.unread && "font-medium")}>
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {relativeTime(item.time)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Popover>
  );
}

export function UserMenu({
  name,
  email,
  onSelect,
  items = ["Profile", "Preferences"],
}: {
  name: string;
  email: string;
  onSelect: (item: string) => void;
  items?: string[];
}) {
  return (
    <Popover
      label={`Account menu for ${name}`}
      testId="user-menu"
      triggerClassName="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
      panelClassName="w-60 p-1"
      trigger={<Avatar name={name} />}
    >
      {(close) => (
        <>
          <div className="px-3 py-2.5">
            <p className="font-medium">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <div className="border-t border-zinc-100 pt-1">
            {[...items, "Sign out"].map((item) => (
              <button
                key={item}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-zinc-100"
                onClick={() => {
                  close();
                  onSelect(item);
                }}
              >
                {item === "Sign out" && (
                  <LogOut className="size-4 text-zinc-500" aria-hidden />
                )}
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </Popover>
  );
}

export function MobileNav({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        className="grid size-9 place-items-center rounded-lg hover:bg-black/5 md:hidden"
        onClick={() => setOpen(true)}
        data-testid="open-nav"
      >
        <MenuIcon className="size-5" aria-hidden />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={<span className="sr-only">{label}</span>}
        placement="start"
        className={cx("w-72 max-w-[85vw] p-4", className)}
      >
        <div
          onClickCapture={(e) =>
            (e.target as HTMLElement).closest("a") && setOpen(false)
          }
        >
          {children}
        </div>
      </Dialog>
    </>
  );
}
