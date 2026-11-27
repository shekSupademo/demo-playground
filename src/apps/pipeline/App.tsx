import {
  Briefcase,
  Building2,
  Check,
  ChevronsUpDown,
  CircleHelp,
  LifeBuoy,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  HashRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Avatar,
  daysFromToday,
  MobileNav,
  NotificationsMenu,
  Popover,
  UserMenu,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Menu, useToasts } from "../../ui";
import { ContactDetail, ContactsPage } from "./contacts";
import {
  type Company,
  type Contact,
  notifications,
  owners,
  companies as seedCompanies,
  seedContacts,
} from "./data";
import { CompaniesPage, DealsPage, SettingsPage } from "./pages";
import { Logo, t } from "./parts";

const workspaces = ["Halcyon Software", "Halcyon Partners EMEA"];

const navLink = (active: boolean) =>
  cx(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium",
    t.focus,
    active
      ? "bg-orange-50 text-orange-800"
      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  );

function NavItems({
  contacts,
  companies,
  toast,
}: {
  contacts: Contact[];
  companies: Company[];
  toast: (m: string) => void;
}) {
  const { pathname } = useLocation();
  const openDeals = contacts
    .flatMap((c) => c.deals)
    .filter(
      (d) => d.stage !== "Closed won" && d.stage !== "Closed lost",
    ).length;
  const items = [
    {
      to: "/",
      label: "Contacts",
      Icon: Users,
      count: contacts.length,
      active: pathname === "/" || pathname.startsWith("/contacts"),
    },
    {
      to: "/companies",
      label: "Companies",
      Icon: Building2,
      count: companies.length,
      active: pathname === "/companies",
    },
    {
      to: "/deals",
      label: "Deals",
      Icon: Briefcase,
      count: openDeals,
      active: pathname === "/deals",
    },
  ];
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
      {items.map(({ to, label, Icon, count, active }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={() => navLink(active)}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{label}</span>
          <span
            className={cx(
              "text-xs tabular-nums",
              active ? "text-orange-700" : "text-stone-400",
            )}
          >
            {count}
          </span>
        </NavLink>
      ))}
      <div className="mt-auto flex flex-col gap-1 border-t border-stone-200 pt-3">
        <NavLink to="/settings" className={({ isActive }) => navLink(isActive)}>
          <Settings className="size-4" aria-hidden /> Settings
        </NavLink>
        <button
          type="button"
          className={navLink(false)}
          onClick={() => toast("Help center opened")}
        >
          <LifeBuoy className="size-4" aria-hidden /> Help center
        </button>
      </div>
    </nav>
  );
}

function WorkspaceSwitcher({ toast }: { toast: (m: string) => void }) {
  const [current, setCurrent] = useState(workspaces[0]);
  return (
    <Popover
      label={`Workspace: ${current}`}
      testId="workspace-switcher"
      triggerClassName={cx(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-stone-100",
        t.focus,
      )}
      panelClassName="w-60 p-1"
      trigger={
        <>
          <Logo />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Pipeline</span>
            <span className="block truncate text-xs text-stone-500">
              {current}
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-stone-400" aria-hidden />
        </>
      }
    >
      {(close) => (
        <>
          <p className="px-3 pt-2 pb-1 text-xs text-stone-500">Workspaces</p>
          {workspaces.map((w) => (
            <button
              key={w}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-stone-100"
              onClick={() => {
                close();
                if (w !== current) {
                  setCurrent(w);
                  toast(`Switched to ${w}`);
                }
              }}
            >
              <span className="flex-1 truncate">{w}</span>
              {w === current && (
                <Check className="size-4 text-orange-600" aria-hidden />
              )}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}

function GlobalSearch({
  contacts,
  setQuery,
  showCompany,
}: {
  contacts: Contact[];
  setQuery: (q: string) => void;
  showCompany: (name: string) => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const q = term.trim().toLowerCase();
  const people = q
    ? contacts
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q),
        )
        .slice(0, 5)
    : [];
  const accounts = q
    ? [...new Set(contacts.map((c) => c.company))]
        .filter((n) => n && n.toLowerCase().includes(q))
        .slice(0, 3)
    : [];
  const finish = () => {
    setTerm("");
    setOpen(false);
  };
  return (
    <form
      role="search"
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        setQuery(term.trim());
        navigate("/");
        finish();
      }}
    >
      <label>
        <span className="sr-only">Search Pipeline</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search contacts and companies"
          className={cx(t.input, "bg-stone-100/70 pl-9 focus:bg-white")}
          data-testid="global-search"
        />
      </label>
      {open && q && (
        <div
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 text-sm shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {people.length + accounts.length === 0 ? (
            <p className="px-4 py-3 text-stone-500">
              No matches for “{term.trim()}”
            </p>
          ) : (
            <>
              {people.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-stone-100"
                  onClick={() => {
                    navigate(`/contacts/${c.id}`);
                    finish();
                  }}
                >
                  <Avatar name={c.name} size={24} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="max-w-40 truncate text-xs text-stone-500">
                    {c.company}
                  </span>
                </button>
              ))}
              {accounts.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-stone-100"
                  onClick={() => {
                    showCompany(name);
                    finish();
                  }}
                >
                  <Building2 className="size-4 text-stone-400" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="text-xs text-stone-500">Company</span>
                </button>
              ))}
            </>
          )}
          <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
            Press Enter to filter contacts
          </p>
        </div>
      )}
    </form>
  );
}

function Shell({ v }: { v: boolean }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState(seedContacts);
  const [query, setQuery] = useState("");
  const [toasts, toast] = useToasts("bg-stone-900 text-white");

  const update = (id: string, change: (c: Contact) => Contact) =>
    setContacts((current) => current.map((c) => (c.id === id ? change(c) : c)));
  const remove = (id: string) =>
    setContacts((current) => current.filter((c) => c.id !== id));
  const showCompany = (name: string) => {
    setQuery(name);
    navigate("/");
  };
  const blank = (id: string): Omit<Contact, "name" | "email" | "company"> => ({
    id,
    title: "",
    phone: "",
    stage: "Lead",
    score: 20,
    owner: owners[0],
    lastContacted: daysFromToday(0),
    deals: [],
    activity: [],
    tasks: [],
  });
  const onImport = (csv: string) => {
    const at = new Date().toISOString();
    const added: Contact[] = csv
      .split("\n")
      .slice(1)
      .map((line) => line.split(",").map((cell) => cell.trim()))
      .filter(([name, email]) => name && email)
      .map(([name, email, company = ""], i) => ({
        ...blank(`import-${Date.now()}-${i}`),
        name,
        email,
        company,
        activity: [
          {
            id: `a-import-${Date.now()}-${i}`,
            kind: "note",
            text: "Imported from CSV",
            at,
          },
        ],
      }));
    setContacts((current) => [...added, ...current]);
    toast(`Imported ${added.length} contacts`);
  };
  const onAdd = (
    c: Pick<Contact, "name" | "email" | "company" | "title" | "owner">,
  ) => {
    setContacts((current) => [
      {
        ...blank(`c-${Date.now()}`),
        ...c,
        activity: [
          {
            id: `a-${Date.now()}`,
            kind: "note",
            text: "Contact created",
            at: new Date().toISOString(),
          },
        ],
      },
      ...current,
    ]);
    toast("Contact added");
  };

  const nav = (
    <NavItems contacts={contacts} companies={seedCompanies} toast={toast} />
  );

  return (
    <div
      className={cx("flex min-h-screen", t.page)}
      style={{ fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" }}
    >
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-stone-200 bg-white px-3 py-4 md:flex">
        <div data-testid="logo">
          <WorkspaceSwitcher toast={toast} />
        </div>
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-stone-200 bg-stone-50/90 px-4 backdrop-blur md:px-8">
          <MobileNav
            label="Pipeline navigation"
            className="bg-white text-stone-900"
          >
            <div className="mb-6 flex items-center gap-2.5 px-2">
              <Logo />
              <span className="font-bold">Pipeline</span>
            </div>
            <div className="flex min-h-[70vh] flex-col">{nav}</div>
          </MobileNav>
          <GlobalSearch
            contacts={contacts}
            setQuery={setQuery}
            showCompany={showCompany}
          />
          <div className="ml-auto flex items-center gap-1">
            <Menu
              label="Help"
              trigger={<CircleHelp className="size-5" aria-hidden />}
              triggerClassName={t.ghost}
              testId="help-menu"
              items={[
                {
                  label: "Keyboard shortcuts",
                  onSelect: () => toast("Keyboard shortcuts opened"),
                },
                {
                  label: "Contact support",
                  onSelect: () => toast("Support chat opened"),
                },
                {
                  label: "What's new",
                  onSelect: () => toast("Release notes opened"),
                },
              ]}
            />
            <NotificationsMenu
              items={notifications}
              triggerClassName="text-stone-600"
            />
            <div className="ml-1">
              <UserMenu
                name="Jordan Ellis"
                email="jordan.ellis@halcyon.dev"
                items={["Profile", "Settings"]}
                onSelect={(item) =>
                  item === "Settings"
                    ? navigate("/settings")
                    : toast(
                        item === "Sign out" ? "Signed out" : "Profile opened",
                      )
                }
              />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route
              index
              element={
                <ContactsPage
                  v={v}
                  contacts={contacts}
                  companies={seedCompanies}
                  query={query}
                  setQuery={setQuery}
                  onImport={onImport}
                  onAdd={onAdd}
                  toast={toast}
                />
              }
            />
            <Route
              path="contacts/:id"
              element={
                <ContactDetail
                  v={v}
                  contacts={contacts}
                  companies={seedCompanies}
                  update={update}
                  remove={remove}
                  toast={toast}
                  showCompany={showCompany}
                />
              }
            />
            <Route
              path="companies"
              element={
                <CompaniesPage
                  companies={seedCompanies}
                  contacts={contacts}
                  showCompany={showCompany}
                />
              }
            />
            <Route path="deals" element={<DealsPage contacts={contacts} />} />
            <Route
              path="settings"
              element={<SettingsPage v={v} onImport={onImport} toast={toast} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {toasts}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  return (
    <HashRouter>
      <Shell v={variant === "variant"} />
    </HashRouter>
  );
}
