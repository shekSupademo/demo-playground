import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "../lib/format";

export type DropdownOption<T extends string> = { value: T; label: string; hint?: string; icon?: ReactNode };

/**
 * Searchable single-select dropdown (combobox). Opens on click, filters as you
 * type, and supports Arrow keys, Enter and Escape.
 */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Select…",
  label,
  searchable = true,
  className,
  testId,
}: {
  value: T | "";
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  label: string;
  searchable?: boolean;
  className?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())), [options, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const h = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, options, value]);

  useEffect(() => {
    root.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (o?: DropdownOption<T>) => {
    if (!o) return;
    onChange(o.value);
    setOpen(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={root} className={cx("relative", className)} data-testid={testId} onKeyDown={onKey}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <span className={cx("flex min-w-0 items-center gap-2 truncate", !selected && "text-zinc-400")}>
          {selected?.icon}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cx("size-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 min-w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 dark:border-zinc-800">
              <Search className="size-3.5 text-zinc-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search…"
                aria-label={`Search ${label.toLowerCase()}`}
                className="h-9 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          )}
          <ul id={listId} role="listbox" aria-label={label} className="max-h-60 overflow-y-auto p-1">
            {filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                data-index={i}
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                className={cx("flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm", i === active && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300")}
              >
                <span className="flex items-center gap-2">
                  {o.icon}
                  {o.label}
                </span>
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  {o.hint}
                  {o.value === value && <Check className="size-3.5 text-indigo-600" />}
                </span>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2 py-4 text-center text-sm text-zinc-500">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
