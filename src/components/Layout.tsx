import { ArrowLeftRight, BarChart3, ClipboardList, ChevronDown, CreditCard, FileText, Home, List, Menu, Moon, Search, Send, Settings, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cx } from "../lib/format";
import { useApplyTheme } from "../lib/theme";
import { useDispatch, useStore } from "../state/store";
import { useUI } from "../state/ui";
import { CommandPalette } from "./CommandPalette";

const nav = [
  { to: "/", label: "Overview", icon: Home, end: true },
  { to: "/transactions", label: "Activity", icon: List },
  { to: "/payments", label: "Payouts", icon: Send },
  { to: "/bills", label: "Payables", icon: ClipboardList },
  { to: "/cards", label: "Company cards", icon: CreditCard },
  { to: "/invoices", label: "Receivables", icon: FileText },
  { to: "/insights", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Admin", icon: Settings },
];

export function Layout() {
  const { settings, transactions } = useStore();
  const dispatch = useDispatch();
  const ui = useUI();
  const [palette, setPalette] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [moveMenu, setMoveMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useApplyTheme(settings.theme);

  useEffect(() => setMobileNav(false), [location.pathname]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    if (!moveMenu) return;
    const h = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMoveMenu(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [moveMenu]);

  const uncategorized = transactions.filter((t) => t.category === "Uncategorized").length;
  const dark = document.documentElement.classList.contains("dark");

  const badge = (to: string) => to === "/transactions" && uncategorized > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-zinc-900">{uncategorized}</span>;

  const topNav = (
    <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
      {nav.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cx("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap", isActive ? "bg-white text-zinc-900" : "text-zinc-300 hover:bg-white/10 hover:text-white")}
        >
          {label}
          {badge(to)}
        </NavLink>
      ))}
    </nav>
  );

  const drawerNav = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", isActive ? "bg-white text-zinc-900" : "text-zinc-300 hover:bg-white/10")}
        >
          <Icon className="size-4" />
          {label}
          <span className="ml-auto">{badge(to)}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-30 bg-zinc-900 text-white shadow-md dark:bg-black">
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-4 px-4 lg:px-8">
          <button className="rounded p-1.5 hover:bg-white/10 xl:hidden" aria-label="Open navigation" onClick={() => setMobileNav(true)}>
            <Menu className="size-5" />
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-sm font-bold">N</span>
            <span className="hidden font-semibold tracking-tight 2xl:inline">{settings.companyName}</span>
          </div>
          {topNav}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setPalette(true)} data-testid="open-search" aria-label="Search or jump to…" className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-sm text-zinc-300 hover:bg-white/15">
              <Search className="size-4" />
              <kbd className="hidden text-[10px] sm:inline">⌘K</kbd>
            </button>
            <button aria-label="Toggle dark mode" data-testid="theme-toggle" className="rounded-full p-2 text-zinc-300 hover:bg-white/10" onClick={() => dispatch({ type: "settings/update", patch: { theme: dark ? "light" : "dark" } })}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMoveMenu((m) => !m)} data-testid="move-money" aria-expanded={moveMenu} className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-200">
                Pay &amp; transfer <ChevronDown className="size-4" />
              </button>
              {moveMenu && (
                <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => { setMoveMenu(false); ui.openSend(); }}>
                    <Send className="size-4" /> Pay someone
                  </button>
                  <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => { setMoveMenu(false); ui.openTransfer(); }}>
                    <ArrowLeftRight className="size-4" /> Move between accounts
                  </button>
                </div>
              )}
            </div>
            <span className="ml-1 hidden size-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold sm:flex" title={settings.userName}>
              {settings.userName.split(" ").map((p) => p[0]).join("")}
            </span>
          </div>
        </div>
      </header>
      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-zinc-950/40 xl:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileNav(false)}>
          <aside className="h-full w-64 bg-zinc-900 text-white">{drawerNav}</aside>
        </div>
      )}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8">
        <Outlet />
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
