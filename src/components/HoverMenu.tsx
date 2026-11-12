import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../lib/format";

export type MenuItem = { label: string; icon?: ReactNode; onSelect?: () => void; danger?: boolean; submenu?: { label: string; icon?: ReactNode; active?: boolean; onSelect: () => void }[] };

/**
 * Menu that opens when the pointer hovers its trigger (and on click or Enter
 * for keyboard users). Items with a submenu open a flyout on hover.
 */
export function HoverMenu({ items, label, testId, className }: { items: MenuItem[]; label: string; testId?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<number | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setSub(null);
    }, 150);
  };
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const run = (fn?: () => void) => {
    fn?.();
    setOpen(false);
    setSub(null);
  };

  return (
    <div ref={root} className={cx("relative inline-block", className)} onMouseEnter={show} onMouseLeave={hide} onClick={(e) => e.stopPropagation()} data-testid={testId}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div role="menu" aria-label={label} className="absolute right-0 top-full z-40 mt-1 w-52 rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {items.map((it, i) => (
            <div key={it.label} className="relative" onMouseEnter={() => setSub(it.submenu ? i : null)}>
              <button
                type="button"
                role="menuitem"
                aria-haspopup={it.submenu ? "menu" : undefined}
                aria-expanded={it.submenu ? sub === i : undefined}
                onClick={() => (it.submenu ? setSub(sub === i ? null : i) : run(it.onSelect))}
                className={cx("flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800", it.danger && "text-rose-600", sub === i && "bg-zinc-50 dark:bg-zinc-800")}
              >
                {it.icon}
                <span className="flex-1">{it.label}</span>
                {it.submenu && <ChevronRight className="size-3.5 text-zinc-400" />}
              </button>
              {it.submenu && sub === i && (
                <div role="menu" aria-label={it.label} className="absolute right-full top-0 z-50 mr-1 max-h-72 w-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {it.submenu.map((s) => (
                    <button key={s.label} type="button" role="menuitemradio" aria-checked={!!s.active} onClick={() => run(s.onSelect)} className={cx("flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800", s.active && "font-medium text-indigo-600")}>
                      {s.icon}
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
