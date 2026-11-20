import { X } from "lucide-react";
import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cx } from "../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:shadow-none dark:disabled:bg-indigo-900",
  secondary: "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
  ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-3.5 text-xs" : "h-9 px-4 text-sm",
        variants[variant],
        className,
      )}
    />
  );
}

export function Panel({ title, action, children, className, padded = true, ...rest }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean; "data-testid"?: string }) {
  return (
    <section {...rest} className={cx("rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-900", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

const tones = {
  gray: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  blue: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};
export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ring-current/15", tones[tone])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

const control = "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(control, !/\bw-/.test(props.className ?? "") && "w-full", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(control, "pr-8", !/\bw-/.test(props.className ?? "") && "w-full", props.className)} />;
}

export function Toggle({ checked, onChange, label, testId }: { checked: boolean; onChange: (v: boolean) => void; label: string; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={cx("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700")}
    >
      <span className={cx("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", checked ? "left-4.5" : "left-0.5")} />
    </button>
  );
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, children, footer, wide, testId }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean; testId?: string }) {
  useEscape(open, onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/50 p-4 pt-[10vh] backdrop-blur" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} data-testid={testId} className={cx("w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900", wide ? "max-w-2xl" : "max-w-md")}>
        <header className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-800/40">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="size-4" />
          </button>
        </header>
        <div className="space-y-4 p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3.5 dark:border-zinc-800">{footer}</footer>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, testId }: { open: boolean; onClose: () => void; title: string; children: ReactNode; testId?: string }) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-label={title} data-testid={testId} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="font-semibold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="inline-flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx("-mb-px border-b-2 px-0.5 pb-2 pt-1 text-xs font-semibold transition-colors", value === o.value ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300" : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-200")}
        >
          {o.label}
          {o.count !== undefined && <span className={cx("ml-1.5 rounded-full px-1.5 py-px text-[10px]", value === o.value ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800")}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

const avatarTones = ["bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"];
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const tone = avatarTones[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % avatarTones.length];
  return (
    <span aria-hidden className={cx("flex shrink-0 items-center justify-center rounded-full font-semibold", size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-11 text-sm" : "size-9 text-xs", tone)}>
      {initials}
    </span>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-sm text-sm text-zinc-500">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
