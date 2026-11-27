import {
  AppWindow,
  Building2,
  CircleHelp,
  CreditCard,
  House,
  LifeBuoy,
  type LucideIcon,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Avatar, MobileNav, NotificationsMenu, UserMenu } from "../../kit";
import type { Variant } from "../../registry";
import { cx, Menu, useToasts } from "../../ui";
import {
  BillingHistory,
  BillingHub,
  InvoiceDetail,
  PaymentMethod,
  SubscriptionRecord,
  SubscriptionsList,
} from "./billing";
import { company, notifications, policies } from "./data";
import {
  AppRecord,
  AppsList,
  DevelopersHub,
  KeyDetail,
  KeysPage,
  Webhooks,
} from "./developers";
import { Logo, Page, t } from "./parts";
import {
  AllMembers,
  MemberRecord,
  OrganizationHub,
  OrganizationProfile,
  OrganizationRegions,
  OrganizationStorage,
  PeopleHub,
  TeamAccess,
  TeamRecord,
  TeamStorage,
  TeamsList,
} from "./people";
import {
  AuditLog,
  AuthenticationDomains,
  AuthenticationMethods,
  AuthenticationPolicy,
  AuthenticationTwoStep,
  OtherPolicy,
  PoliciesList,
  SecurityHub,
  SignInPolicy,
} from "./security";
import { StoreProvider, useStore } from "./store";

const areas: {
  to: string;
  label: string;
  Icon: LucideIcon;
  id: string;
  blurb: string;
}[] = [
  {
    to: "/people",
    label: "People",
    Icon: Users,
    id: "people",
    blurb: "Teams, members and roles",
  },
  {
    to: "/organization",
    label: "Organization",
    Icon: Building2,
    id: "organization",
    blurb: "Company details and data region",
  },
  {
    to: "/security",
    label: "Security",
    Icon: ShieldCheck,
    id: "security",
    blurb: "Sign-in policies and the audit log",
  },
  {
    to: "/developers",
    label: "Developers",
    Icon: AppWindow,
    id: "developers",
    blurb: "Apps, API keys and webhooks",
  },
  {
    to: "/billing",
    label: "Billing",
    Icon: CreditCard,
    id: "billing",
    blurb: "Subscriptions and invoices",
  },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
    t.focus,
    isActive
      ? "bg-white/10 text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white",
  );

function Nav({ toast }: { toast: (m: string) => void }) {
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
      <NavLink to="/" end className={navClass} data-testid="nav-home">
        <House className="size-4" aria-hidden /> Home
      </NavLink>
      {areas.map(({ to, label, Icon, id }) => (
        <NavLink
          key={to}
          to={to}
          className={navClass}
          data-testid={`nav-${id}`}
        >
          <Icon className="size-4" aria-hidden /> {label}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-white/10 pt-3">
        <button
          type="button"
          className={cx(navClass({ isActive: false }), "w-full")}
          onClick={() => toast("Help center opened")}
        >
          <LifeBuoy className="size-4" aria-hidden /> Help center
        </button>
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <Logo />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">Corvid</span>
        <span className="block truncate text-xs text-slate-400">
          {company.name}
        </span>
      </span>
    </div>
  );
}

function GlobalSearch() {
  const { members, teams, apps } = useStore();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const q = term.trim().toLowerCase();
  const results: {
    key: string;
    label: string;
    kind: string;
    to: string;
    avatar?: boolean;
  }[] = q
    ? [
        ...members
          .filter((m) => m.name.toLowerCase().includes(q))
          .slice(0, 4)
          .map((m) => ({
            key: m.id,
            label: m.name,
            kind: "Member",
            to: `/people/teams/${m.teamId}/members/${m.id}`,
            avatar: true,
          })),
        ...teams
          .filter((x) => x.name.toLowerCase().includes(q))
          .slice(0, 3)
          .map((x) => ({
            key: x.id,
            label: x.name,
            kind: "Team",
            to: `/people/teams/${x.id}`,
          })),
        ...apps
          .filter((a) => a.name.toLowerCase().includes(q))
          .slice(0, 3)
          .map((a) => ({
            key: a.id,
            label: a.name,
            kind: "App",
            to: `/developers/apps/${a.id}`,
          })),
      ]
    : [];
  return (
    <div role="search" className="relative w-full max-w-md">
      <label>
        <span className="sr-only">Search members, teams and apps</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
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
          placeholder="Search members, teams and apps"
          className={cx(t.input, "bg-slate-100 pl-9 focus:bg-white")}
          data-testid="global-search"
        />
      </label>
      {open && q && (
        <div
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-slate-500">
              No members, teams or apps match “{term.trim()}”
            </p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.kind}-${r.key}`}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-100"
                onClick={() => {
                  navigate(r.to);
                  setTerm("");
                  setOpen(false);
                }}
              >
                {r.avatar ? (
                  <Avatar name={r.label} size={22} />
                ) : (
                  <span className="size-[22px]" />
                )}
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                <span className="text-xs text-slate-500">{r.kind}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Home() {
  const { members, teams, apps } = useStore();
  const stats: Record<string, ReactNode> = {
    people: `${members.length} members in ${teams.length} teams`,
    organization: company.region,
    security: `${members.filter((m) => m.twoFactor === "Not enrolled").length} without 2-step verification`,
    developers: `${apps.length} apps, 3 webhooks`,
    billing: `${company.plan} plan`,
  };
  return (
    <Page
      crumbs={[{ label: "Home" }]}
      title="Welcome back, Priya"
      description={`Manage ${company.name}'s people, security and billing from here.`}
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map(({ to, label, Icon, id, blurb }) => (
          <li key={to}>
            <Link
              to={to}
              data-testid={`home-${id}`}
              className={cx(
                t.panel,
                "flex h-full flex-col gap-3 p-5 hover:border-[#3046C5]/40 hover:shadow-sm",
                t.focus,
              )}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-[#EEF0FC] text-[#3046C5]">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-slate-500">{blurb}</span>
              </span>
              <span className="mt-auto text-sm text-slate-700 tabular-nums">
                {stats[id]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

function PolicyRoute() {
  const { policyId } = useParams();
  const { v } = useStore();
  if (policyId === "sign-in")
    return v ? <Navigate to="/security/policies" replace /> : <SignInPolicy />;
  if (policyId === "authentication")
    return v ? (
      <AuthenticationPolicy />
    ) : (
      <Navigate to="/security/policies" replace />
    );
  if (policies.some((p) => p.id === policyId))
    return <OtherPolicy id={policyId ?? ""} />;
  return <Navigate to="/security/policies" replace />;
}

function NotFound() {
  return (
    <Page
      crumbs={[{ label: "Home", to: "/" }, { label: "Page not found" }]}
      title="Page not found"
      description="This page moved or no longer exists."
    >
      <div>
        <Link to="/" className={t.primary}>
          Go to Home
        </Link>
      </div>
    </Page>
  );
}

function Shell({
  toasts,
  toast,
}: {
  toasts: ReactNode;
  toast: (m: string) => void;
}) {
  const { v } = useStore();
  const navigate = useNavigate();
  return (
    <div
      className={cx("flex min-h-screen", t.page)}
      style={{ fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif" }}
    >
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 bg-[#141B3D] px-3 py-4 md:flex"
        data-testid="logo"
      >
        <Brand />
        <Nav toast={toast} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <MobileNav
            label="Corvid navigation"
            className="bg-[#141B3D]"
          >
            <div className="mb-6">
              <Brand />
            </div>
            <div className="flex min-h-[70vh] flex-col">
              <Nav toast={toast} />
            </div>
          </MobileNav>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <Menu
              label="Help"
              trigger={<CircleHelp className="size-5" aria-hidden />}
              triggerClassName={t.ghost}
              testId="help-menu"
              items={[
                {
                  label: "Admin guide",
                  onSelect: () => toast("Admin guide opened"),
                },
                {
                  label: "Contact support",
                  onSelect: () => toast("Support chat opened"),
                },
                {
                  label: "System status",
                  onSelect: () => toast("Status page opened"),
                },
              ]}
            />
            <NotificationsMenu
              items={notifications}
              triggerClassName="text-slate-600"
            />
            <div className="ml-1">
              <UserMenu
                name="Priya Raman"
                email="priya@halden.io"
                items={["Your profile", "Switch organization"]}
                onSelect={(item) =>
                  item === "Your profile"
                    ? navigate("/people/teams/engineering/members/priya-raman")
                    : toast(
                        item === "Sign out"
                          ? "Signed out"
                          : "You only belong to Halden Robotics",
                      )
                }
              />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route index element={<Home />} />
            <Route path="people" element={<PeopleHub />} />
            <Route path="people/members" element={<AllMembers />} />
            <Route path="people/teams" element={<TeamsList />} />
            <Route path="people/teams/:teamId" element={<TeamRecord />} />
            <Route
              path="people/teams/:teamId/access"
              element={<TeamAccess />}
            />
            {!v && (
              <Route
                path="people/teams/:teamId/storage"
                element={<TeamStorage />}
              />
            )}
            <Route
              path="people/teams/:teamId/members/:memberId"
              element={<MemberRecord />}
            />
            <Route path="organization" element={<OrganizationHub />} />
            <Route
              path="organization/profile"
              element={<OrganizationProfile />}
            />
            <Route
              path="organization/regions"
              element={<OrganizationRegions />}
            />
            {v && (
              <Route
                path="organization/storage"
                element={<OrganizationStorage />}
              />
            )}
            <Route path="security" element={<SecurityHub />} />
            <Route path="security/audit" element={<AuditLog />} />
            <Route path="security/policies" element={<PoliciesList />} />
            <Route
              path="security/policies/:policyId"
              element={<PolicyRoute />}
            />
            {v && (
              <Route
                path="security/policies/authentication/domains"
                element={<AuthenticationDomains />}
              />
            )}
            {v && (
              <Route
                path="security/policies/authentication/methods"
                element={<AuthenticationMethods />}
              />
            )}
            {v && (
              <Route
                path="security/policies/authentication/two-step"
                element={<AuthenticationTwoStep />}
              />
            )}
            <Route path="developers" element={<DevelopersHub />} />
            <Route path="developers/webhooks" element={<Webhooks />} />
            <Route path="developers/apps" element={<AppsList />} />
            <Route path="developers/apps/:appId" element={<AppRecord />} />
            {v && (
              <Route
                path="developers/apps/:appId/keys"
                element={<KeysPage />}
              />
            )}
            <Route
              path="developers/apps/:appId/keys/:keyId"
              element={<KeyDetail />}
            />
            <Route path="billing" element={<BillingHub />} />
            <Route path="billing/payment" element={<PaymentMethod />} />
            <Route
              path="billing/subscriptions"
              element={<SubscriptionsList />}
            />
            <Route
              path="billing/subscriptions/:subscriptionId"
              element={<SubscriptionRecord />}
            />
            {!v && (
              <Route
                path="billing/subscriptions/:subscriptionId/invoices/:invoiceId"
                element={<InvoiceDetail />}
              />
            )}
            {v && <Route path="billing/history" element={<BillingHistory />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      {toasts}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const [toasts, toast] = useToasts("bg-[#141B3D] text-white");
  return (
    <HashRouter>
      <StoreProvider v={variant === "variant"} toast={toast}>
        <Shell toasts={toasts} toast={toast} />
      </StoreProvider>
    </HashRouter>
  );
}
